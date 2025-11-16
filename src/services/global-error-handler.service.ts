import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslationService } from './translation.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  private notificationService = inject(NotificationService);
  private zone = inject(NgZone);
  private translationService = inject(TranslationService);

  handleError(error: any): void {
    const errorId = `CLIENT-${Date.now().toString(36)}`;
    // Log the actual error to the console for developers
    console.error(`Unhandled Error (ID: ${errorId}):`, error);

    // If the error is an HttpErrorResponse, it was likely already handled by the interceptor.
    // We log it but avoid showing a duplicate notification unless it's a very specific case
    // we want to handle differently here. For now, we'll assume the interceptor is sufficient.
    if (error instanceof HttpErrorResponse) {
      console.warn('HttpErrorResponse caught by GlobalErrorHandler. Was it expected?');
      return; // Exit to prevent duplicate notifications
    }

    // For non-HTTP errors, extract a user-friendly message.
    const rawMessage = error.rejection?.message || error.message || 'An unexpected client-side error occurred.';
    const message = this.translationService.getTranslation('errorMessages.clientError', { message: rawMessage });
    
    // Ensure the notification runs within Angular's zone to trigger change detection
    this.zone.run(() => {
        this.notificationService.showError(message, errorId);
    });
  }
}