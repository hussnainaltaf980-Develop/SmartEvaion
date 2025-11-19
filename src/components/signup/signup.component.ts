
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

export const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordsMismatch: true });
    return { passwordsMismatch: true };
  }
  
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
  
  step = signal<1 | 2>(1);
  selectedRole = signal<'candidate' | 'company'>('candidate');
  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  
  photoPreview = signal<string | null>(null);
  logoPreview = signal<string | null>(null);

  commonForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatchValidator });

  candidateForm = this.fb.group({
    name: ['', Validators.required],
    fatherName: [''],
    gender: ['', Validators.required],
    dob: ['', Validators.required],
    cnic: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{7}-\d{1}$/)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\+?\d{10,14}$/)]],
    photoUrl: [''],
    agreeToTerms: [false, Validators.requiredTrue]
  });

  companyForm = this.fb.group({
    name: ['', Validators.required],
    companyName: ['', Validators.required],
    companyLogo: ['', Validators.required],
    agreeToTerms: [false, Validators.requiredTrue]
  });

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
            this.candidateForm.patchValue({ photoUrl: result });
        } else {
            this.logoPreview.set(result);
            this.companyForm.patchValue({ companyLogo: result });
            this.companyForm.get('companyLogo')?.updateValueAndValidity();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  setRole(role: 'candidate' | 'company'): void {
    this.selectedRole.set(role);
  }

  nextStep(): void {
    this.commonForm.markAllAsTouched();
    if (this.commonForm.invalid) {
      this.notificationService.showError('Please fill out the required fields correctly to continue.');
      return;
    }
    this.step.set(2);
  }

  prevStep(): void {
    this.step.set(1);
  }

  socialLogin(provider: string): void {
    this.notificationService.showInfo(`${provider} login is for demonstration purposes only.`);
  }

  onSubmit(): void {
    const roleForm = this.selectedRole() === 'candidate' ? this.candidateForm : this.companyForm;
    roleForm.markAllAsTouched();

    if (roleForm.invalid) {
      this.notificationService.showError('Please correct the errors in the form before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    
    const commonData = this.commonForm.getRawValue();
    const roleData = roleForm.getRawValue();

    const { confirmPassword, ...finalCommonData } = commonData;
    const { agreeToTerms, ...finalRoleData } = roleData;
    
    // Admin-level registration creates a 'super-admin' via the 'company' flow for demo purposes here
    const finalRole = this.selectedRole() === 'candidate' ? 'candidate' : 'super-admin';
    
    const payload: Omit<User, 'id' | 'disabled'> = {
      ...finalCommonData,
      ...finalRoleData,
      role: finalRole,
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
        this.isSubmitting.set(false);
        console.error('Signup failed:', err);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
