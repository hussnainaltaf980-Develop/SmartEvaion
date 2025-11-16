import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../services/notification.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
  translationService = inject(TranslationService);
  notifications = this.notificationService.notifications;

  reportError(notification: Notification): void {
    const errorDetails = `
Error Report for Evalion Vertex
---------------------------------
Error ID: ${notification.errorId}
Message: ${notification.message}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `;
    navigator.clipboard.writeText(errorDetails.trim())
      .then(() => {
        this.notificationService.showSuccess(this.translationService.getTranslation('errorMessages.copiedToClipboard'));
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
        // Fallback message in case clipboard API fails
        this.notificationService.showError('Failed to copy details. Please manually copy the Error ID.');
      });
  }
}