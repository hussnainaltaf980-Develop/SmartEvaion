import { HttpErrorResponse, HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, retry, timer } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { TranslationService } from '../services/translation.service';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Context token to suppress the global error notification for specific requests.
 * Services can set this to true if they have a fallback mechanism (e.g., mock data).
 */
export const SUPPRESS_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);
  const translationService = inject(TranslationService);

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: HttpErrorResponse, retryCount) => {
        // Only retry idempotent GET requests on network errors or specific transient server errors (503, 504).
        if (req.method !== 'GET' || (error.status !== 0 && error.status !== 503 && error.status !== 504)) {
          return throwError(() => error);
        }
        
        // Use exponential backoff for the delay
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
        console.log(`Attempt ${retryCount}: Retrying request in ${delay}ms due to error: ${error.status}`);
        return timer(delay);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // If the request context has suppression enabled, just re-throw without showing a notification.
      if (req.context.get(SUPPRESS_ERROR_NOTIFICATION)) {
        return throwError(() => error);
      }
      
      let errorMessage: string;
      const errorId = `HTTP-${Date.now().toString(36)}`;

      // Log the full error for debugging purposes
      console.error(`HTTP Error Interceptor (ID: ${errorId}):`, 
        error.message, 
        error.status, 
        error.url, 
        error.error
      );

      if (error.status === 0 || error.error instanceof ErrorEvent) {
        // This is a client-side or network error. Handle these gracefully.
        errorMessage = translationService.getTranslation('errorMessages.networkError');
      } else {
        // The backend returned an unsuccessful response code.
        // The response body may contain clues as to what went wrong.
        
        // Prioritize the specific error message from the backend API if available.
        errorMessage = error.error?.message;

        // Fallback to generic messages based on status code if no specific message is provided.
        if (!errorMessage) {
            switch (error.status) {
              case 401:
                errorMessage = translationService.getTranslation('errorMessages.authFailed');
                break;
              case 403:
                errorMessage = translationService.getTranslation('errorMessages.accessDenied');
                break;
              case 404:
                errorMessage = translationService.getTranslation('errorMessages.notFound');
                break;
              case 429:
                errorMessage = translationService.getTranslation('errorMessages.tooManyRequests');
                break;
              case 500:
              case 503:
              case 504:
                errorMessage = translationService.getTranslation('errorMessages.serverError');
                break;
              default:
                errorMessage = translationService.getTranslation('errorMessages.unexpectedError', { status: error.status });
            }
        }
      }
      
      // Special handling for 401 Unauthorized to log out the user automatically
      if (error.status === 401) {
          // Avoid a redirect loop if the 401 error comes from the login API itself.
          // The login component handles its own error display.
          if (!req.url.includes('/api/auth/login')) {
            authService.logout();
          }
      }

      notificationService.showError(errorMessage, errorId);
      return throwError(() => error);
    })
  );
};
