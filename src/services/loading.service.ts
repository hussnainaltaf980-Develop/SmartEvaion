import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCounter = signal(0);

  /**
   * A computed signal that is true if any loading process is active.
   */
  isLoading = computed(() => this.loadingCounter() > 0);

  /**
   * Shows the loading indicator. Call this before starting an async operation.
   */
  show(): void {
    this.loadingCounter.update(c => c + 1);
  }

  /**
   * Hides the loading indicator. Call this after an async operation completes.
   */
  hide(): void {
    this.loadingCounter.update(c => (c > 0 ? c - 1 : 0));
  }
}
