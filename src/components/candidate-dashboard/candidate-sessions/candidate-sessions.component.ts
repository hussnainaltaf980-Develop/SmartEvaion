
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { InterviewService, InterviewTemplate } from '../../../services/interview.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-candidate-sessions',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FormsModule, TitleCasePipe, EmptyStateComponent],
  templateUrl: './candidate-sessions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateSessionsComponent {
  interviewService = inject(InterviewService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  templates = this.interviewService.interviewTemplates;
  pastSessions = this.interviewService.sessions;

  showStartDialog = signal<InterviewTemplate | null>(null);
  sessionTitle = signal('');
  isStarting = signal(false);

  startInterview(template: InterviewTemplate) {
    this.sessionTitle.set(`${template.jobTitle} Practice`);
    this.showStartDialog.set(template);
  }

  cancelStart() {
    this.showStartDialog.set(null);
    this.sessionTitle.set('');
  }

  async confirmStart() {
    const template = this.showStartDialog();
    const user = this.authService.currentUser();
    if (!template || !user) return;

    this.isStarting.set(true);
    const sessionId = await this.interviewService.startInterviewSession(template.id, user, this.sessionTitle());
    this.isStarting.set(false);

    if (sessionId) {
      // The service has already entered focus mode.
      this.notificationService.showSuccess("Interview started! Focus mode is active.");
      this.showStartDialog.set(null);
    }
  }
}
