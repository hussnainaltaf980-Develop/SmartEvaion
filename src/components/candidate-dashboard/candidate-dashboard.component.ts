import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ThemeCustomizerComponent } from '../shared/theme-customizer.component';
import { InterviewService } from '../../services/interview.service';
import { CanComponentDeactivate } from '../../guards/interview-in-progress.guard';
import { Observable, of } from 'rxjs';
import { CodingArenaComponent } from '../coding-arena/coding-arena.component';
import { CandidateOverviewComponent } from './candidate-overview/candidate-overview.component';
import { CandidateSessionsComponent } from './candidate-sessions/candidate-sessions.component';
import { CandidateProfileComponent } from './candidate-profile/candidate-profile.component';

export type DashboardView =
  | 'overview'
  | 'sessions'
  | 'profile'
  | 'settings'
  | 'codingArena';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    ThemeCustomizerComponent,
    CodingArenaComponent,
    CandidateOverviewComponent,
    CandidateSessionsComponent,
    CandidateProfileComponent
  ],
  templateUrl: './candidate-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateDashboardComponent
  implements OnInit, OnDestroy, CanComponentDeactivate
{
  authService = inject(AuthService);
  interviewService = inject(InterviewService);
  router = inject(Router);

  currentView = signal<DashboardView>('overview');
  isSidebarOpen = signal(true);
  userName = this.authService.currentUserName;

  ngOnInit(): void {
    // Component initialization logic can go here
  }

  ngOnDestroy(): void {
    // Cleanup logic can go here
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.interviewService.isFocusMode()) {
      return confirm(
        'You have an interview in progress. Are you sure you want to leave? Your progress might be lost.'
      );
    }
    return true;
  }

  changeView(view: DashboardView): void {
    this.currentView.set(view);
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
