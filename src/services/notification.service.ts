import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
  errorId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private idCounter = 0;

  private addNotification(message: string, type: Notification['type'], errorId?: string): void {
    const id = this.idCounter++;
    this.notifications.update(current => [...current, { id, message, type, errorId }]);

    // Auto-dismiss after 7 seconds for non-errors, 10 for errors
    const dismissTimeout = type === 'error' ? 10000 : 7000;
    setTimeout(() => this.removeNotification(id), dismissTimeout);
  }

  showError(message: string, errorId?: string): void {
    this.addNotification(message, 'error', errorId);
  }

  showSuccess(message: string): void {
    this.addNotification(message, 'success');
  }

  showInfo(message: string): void {
    this.addNotification(message, 'info');
  }

  removeNotification(id: number): void {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }
}