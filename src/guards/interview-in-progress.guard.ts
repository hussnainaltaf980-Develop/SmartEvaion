import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * An interface for components that can be checked for deactivation.
 */
export interface CanComponentDeactivate {
  /**
   * A method that returns true if the component can be deactivated, or a confirmation prompt result.
   */
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

/**
 * A route guard that checks if a component can be deactivated.
 * It looks for a `canDeactivate` method on the component instance.
 */
export const interviewInProgressGuard: CanDeactivateFn<CanComponentDeactivate> = (component: CanComponentDeactivate) => {
  // If the component has a canDeactivate method, call it. Otherwise, allow deactivation.
  return component.canDeactivate ? component.canDeactivate() : true;
};
