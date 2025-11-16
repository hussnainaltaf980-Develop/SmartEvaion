import { ChangeDetectionStrategy, Component, inject, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LoadingSpinnerComponent } from './components/shared/loading-spinner/loading-spinner.component';
import { NotificationComponent } from './components/shared/notification/notification.component';
import { TranslationService } from './services/translation.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { ThemeService } from './services/theme.service';
import { InterviewService } from './services/interview.service';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, CommonModule, ChatbotComponent, LoadingSpinnerComponent, NotificationComponent, TranslatePipe]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  translationService = inject(TranslationService);
  themeService = inject(ThemeService);
  interviewService = inject(InterviewService);
  webSocketService = inject(WebSocketService);
  
  isAuthenticated = this.authService.isAuthenticated;

  constructor() {
    effect(() => {
      // This effect will run whenever isFocusMode changes, applying the CSS class to the body.
      const isFocus = this.interviewService.isFocusMode();
      if (typeof document !== 'undefined') {
        if (isFocus) {
          document.body.classList.add('focus-mode');
        } else {
          document.body.classList.remove('focus-mode');
        }
      }
    });

    effect(() => {
      if (this.isAuthenticated()) {
        this.webSocketService.connect();
      } else {
        this.webSocketService.disconnect();
      }
    });
  }

  ngOnInit(): void {
    this.translationService.loadAndSetLanguage();
  }
}
