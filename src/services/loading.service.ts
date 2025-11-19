
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCounter = signal(0);
  
  // Signal to hold the current loading message
  message = signal<string>('Loading...');

  /**
   * A computed signal that is true if any loading process is active.
   */
  isLoading = computed(() => this.loadingCounter() > 0);

  /**
   * Shows the loading indicator with an optional message.
   * @param msg The message to display (default: 'Loading...')
   */
  show(msg: string = 'Loading...'): void {
    this.message.set(msg);
    this.loadingCounter.update(c => c + 1);
  }

  /**
   * Hides the loading indicator.
   */
  hide(): void {
    this.loadingCounter.update(c => (c > 0 ? c - 1 : 0));
    // Reset message to default when fully hidden
    if (this.loadingCounter() === 0) {
      this.message.set('Loading...');
    }
  }
}
