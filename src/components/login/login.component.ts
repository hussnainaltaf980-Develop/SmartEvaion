
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';
import { HeaderComponent } from '../shared/header.component';
import { FooterComponent } from '../shared/footer.component';
import { NotificationService } from '../../services/notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent, TranslatePipe],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);

  loginState = signal<'login' | 'forgot-password' | 'reset-sent'>('login');
  isSubmitting = signal(false);
  isResettingPassword = signal(false);
  loginError = signal<string | null>(null);

  // Strictly empty initial state for production
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  activeRole = signal<UserRole | 'admin'>('candidate');
  showPassword = signal(false);

  setActiveRole(role: UserRole | 'admin'): void {
    this.activeRole.set(role);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }
  
  forgotPassword(): void {
    this.loginState.set('forgot-password');
  }

  requestPasswordReset(): void {
    if (this.forgotPasswordForm.invalid) {
      this.notificationService.showError(this.translationService.getTranslation('login.validEmailRequired'));
      return;
    }
    
    this.isResettingPassword.set(true);

    // Simulate API call for reset
    setTimeout(() => {
      this.isResettingPassword.set(false);
      this.loginState.set('reset-sent');
    }, 1500);
  }

  backToLogin(): void {
    this.loginState.set('login');
  }

  socialLogin(provider: string): void {
    this.notificationService.showInfo(`${provider} login is for demonstration purposes only.`);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.notificationService.showError(this.translationService.getTranslation('login.validCredentialsRequired'));
      return;
    }

    this.isSubmitting.set(true);
    this.loginError.set(null);
    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login(email!, password!, !!rememberMe).subscribe({
      next: (response) => {
        // Success logic handled in AuthService (redirects)
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const apiMessage = err.error?.message || '';
        
        if (apiMessage.includes('Invalid credentials')) {
          this.loginError.set(this.translationService.getTranslation('login.invalidCredentials'));
        } else if (apiMessage.includes('Account is disabled')) {
          this.loginError.set(this.translationService.getTranslation('login.accountDisabled'));
        } else if (err.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
          this.loginError.set(this.translationService.getTranslation('login.networkError'));
        } else {
          this.loginError.set(this.translationService.getTranslation('login.serverError'));
        }
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
