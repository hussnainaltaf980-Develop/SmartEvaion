import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { HeaderComponent } from '../shared/header.component';
import { NotificationService } from '../../services/notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { FooterComponent } from '../shared/footer.component';

// Custom validator to check if passwords match
export const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    // Set the error on the confirmPassword field to display the message there
    confirmPassword.setErrors({ passwordsMismatch: true });
    return { passwordsMismatch: true };
  }
  
  // If they match, remove the error from the confirmPassword field
  if (confirmPassword?.hasError('passwordsMismatch')) {
    confirmPassword.setErrors(null);
  }

  return null;
};

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, TranslatePipe, FooterComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router: Router = inject(Router);
  private translationService = inject(TranslationService);
  
  portal = signal<'candidate' | 'admin'>('candidate');
  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  
  photoPreview = signal<string | null>(null);
  photoFileName = signal<string | null>(null);

  logoPreview = signal<string | null>(null);
  logoFileName = signal<string | null>(null);

  candidateForm = this.fb.group({
    name: ['', Validators.required],
    fatherName: [''],
    gender: ['', Validators.required],
    dob: ['', Validators.required],
    cnic: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{7}-\d{1}$/)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\+?\d{10,14}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    photoUrl: [''],
    agreeToTerms: [false, Validators.requiredTrue]
  }, { validators: passwordsMatchValidator });

  adminForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    companyName: ['', Validators.required],
    companyLogo: ['', Validators.required],
    agreeToTerms: [false, Validators.requiredTrue]
  }, { validators: passwordsMatchValidator });

  constructor() {}

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(value => !value);
  }
  
  onFileChange(event: Event, type: 'photo' | 'logo'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'photo') {
            this.photoPreview.set(result);
            this.photoFileName.set(file.name);
            this.candidateForm.patchValue({ photoUrl: result });
        } else {
            this.logoPreview.set(result);
            this.logoFileName.set(file.name);
            this.adminForm.patchValue({ companyLogo: result });
            this.adminForm.get('companyLogo')?.updateValueAndValidity();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    const isCandidate = this.portal() === 'candidate';
    const form = isCandidate ? this.candidateForm : this.adminForm;

    if (form.invalid) {
      form.markAllAsTouched();
      this.notificationService.showError('Please correct the errors in the form before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    
    const { confirmPassword, agreeToTerms, ...userData } = form.value as any;

    const payload: Omit<User, 'id' | 'disabled'> = {
      ...userData,
      role: isCandidate ? 'candidate' : 'super-admin',
    };
    
    this.authService.signUp(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess(this.translationService.getTranslation('signup.successMessage'));
          this.router.navigate(['/login']);
        } else {
          this.notificationService.showError(response.message || 'An unknown error occurred.');
        }
      },
      error: (err) => {
        console.error('Signup failed:', err);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}