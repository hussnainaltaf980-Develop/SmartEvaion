import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { InterviewService } from '../../../services/interview.service';
import { AuthService } from '../../../services/auth.service';
import { DashboardView } from '../candidate-dashboard.component';

@Component({
  selector: 'app-candidate-overview',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './candidate-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateOverviewComponent {
  interviewService = inject(InterviewService);
  authService = inject(AuthService);

  changeView = output<DashboardView>();

  userName = this.authService.currentUserName;
  
  sessionsCompleted = computed(() => {
    return this.interviewService.sessions().filter(s => s.status !== 'pending' && s.completedAt).length;
  });

  averageScore = computed(() => {
    const completed = this.interviewService.sessions().filter(s => s.overallScore !== undefined);
    if (completed.length === 0) return 'N/A';
    const total = completed.reduce((acc, s) => acc + (s.overallScore ?? 0), 0);
    return (total / completed.length).toFixed(1);
  });

  startNewSession() {
    this.changeView.emit('sessions');
  }
}
