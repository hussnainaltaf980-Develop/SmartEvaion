import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  // Explicitly type the Router to prevent type inference issues with circular dependencies.
  const router: Router = inject(Router);

  if (authService.isAuthenticated()) {
    // If user is already authenticated, redirect them to their dashboard
    // by returning a UrlTree, which is the recommended practice for guards.
    const role = authService.currentUserRole();
    const targetRoute = role === 'candidate' ? '/candidate' : '/admin';
    return router.createUrlTree([targetRoute]);
  }

  // If not authenticated, allow access.
  return true;
};
