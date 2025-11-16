import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // Check if the request URL is for our API (starts with /api/)
  // This avoids sending the token to external services like Google Fonts, etc.
  if (authToken && req.url.startsWith('/api/')) {
    // Clone the request to add the new header.
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
    // Pass on the cloned request instead of the original request.
    return next(authReq);
  }
  
  // If no token or not an API request, pass the original request along
  return next(req);
};
