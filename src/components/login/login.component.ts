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
  private router: Router = inject(Router);
  private translationService = inject(TranslationService);

  loginState = signal<'login' | 'forgot-password' | 'reset-sent'>('login');
  isSubmitting = signal(false);
  isResettingPassword = signal(false); // New signal for reset password loading
  loginError = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['candidate@example.com', [Validators.required, Validators.email]],
    password: ['password123', Validators.required],
    rememberMe: [true]
  });

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  activeRole = signal<UserRole | 'admin'>('candidate');
  showPassword = signal(false);
  currentYear = new Date().getFullYear();

  setActiveRole(role: UserRole | 'admin'): void {
    this.activeRole.set(role);
    if (role === 'admin') {
        this.loginForm.patchValue({ email: 'hussnainmr07@gmail.com', password: 'password123' });
    } else {
        this.loginForm.patchValue({ email: 'candidate@example.com', password: 'password123' });
    }
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
    
    this.isResettingPassword.set(true); // Start loading

    // Simulate an API call for password reset
    setTimeout(() => {
      // In a real app, you'd call a service here:
      // this.authService.requestPasswordReset(this.forgotPasswordForm.value.email!).subscribe({
      //   next: () => {
      //     this.loginState.set('reset-sent');
      //   },
      //   error: (err) => {
      //     this.notificationService.showError(err.error?.message || 'Failed to send reset link.');
      //   },
      //   complete: () => {
      //     this.isResettingPassword.set(false);
      //   }
      // });
      this.isResettingPassword.set(false); // Stop loading
      this.loginState.set('reset-sent'); // Transition to success state
    }, 1500); // Simulate network delay
  }

  backToLogin(): void {
    this.loginState.set('login');
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
        // On success, the auth service handles navigation and shows success notification
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