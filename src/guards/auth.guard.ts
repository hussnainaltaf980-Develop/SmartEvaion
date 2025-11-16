import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router: Router = inject(Router);
  const notificationService = inject(NotificationService);

  // 1. Check for authentication first
  if (!authService.isAuthenticated()) {
    // Redirect to the login page if not authenticated
    return router.createUrlTree(['/login']);
  }

  // 2. Check for role authorization
  const expectedRoles = route.data?.['roles'] as UserRole[] | undefined;
  
  // If no roles are specified for the route, allow access for any authenticated user
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  const currentUserRole = authService.currentUserRole();

  // If user has a role and it's one of the expected roles, allow access
  if (currentUserRole && expectedRoles.includes(currentUserRole)) {
    return true;
  }
  
  // 3. If user does not have the required role
  notificationService.showError('Access Denied. You do not have permission to view this page.');

  // Redirect unauthorized user to their default dashboard
  const userRole = authService.currentUserRole();
  // Handle case where user might not have a role somehow
  if (!userRole) {
    return router.createUrlTree(['/login']);
  }
  const defaultRoute = userRole === 'candidate' ? '/candidate' : '/admin';
  return router.createUrlTree([defaultRoute]);
};
