import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './candidate-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateProfileComponent implements OnInit {
  authService = inject(AuthService);
  private fb: FormBuilder = inject(FormBuilder);
  notificationService = inject(NotificationService);

  isSubmitting = signal(false);
  photoPreview = signal<string | null>(null);
  
  profileForm = this.fb.group({
    name: ['', Validators.required],
    fatherName: [''],
    dob: ['', Validators.required],
    cnic: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{7}-\d{1}$/)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\+?\d{10,14}$/)]],
    email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
    photoUrl: [''],
  });

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.profileForm.patchValue({
        name: currentUser.name,
        fatherName: currentUser.fatherName,
        dob: currentUser.dob ? new Date(currentUser.dob).toISOString().split('T')[0] : '',
        cnic: currentUser.cnic,
        mobile: currentUser.mobile,
        email: currentUser.email,
        photoUrl: currentUser.photoUrl
      });
      if (currentUser.photoUrl) {
        this.photoPreview.set(currentUser.photoUrl);
      }
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.photoPreview.set(result);
        this.profileForm.patchValue({ photoUrl: result });
        this.profileForm.get('photoUrl')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }
  
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.notificationService.showError('Please correct the errors before saving.');
      return;
    }
    if (!this.profileForm.dirty) {
      this.notificationService.showInfo('No changes to save.');
      return;
    }
    
    this.isSubmitting.set(true);
    this.authService.updateUserProfile(this.profileForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.showSuccess('Profile updated successfully!');
          this.profileForm.markAsPristine();
        }
      },
      // Error is handled by the interceptor
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}