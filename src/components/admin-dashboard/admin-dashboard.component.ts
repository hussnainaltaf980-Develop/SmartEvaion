
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User, UserRole } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, EmptyStateComponent],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  users = signal<User[]>([]);
  isLoading = signal(true);
  
  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.notificationService.showError('Failed to load users.');
        this.isLoading.set(false);
      }
    });
  }

  toggleStatus(user: User): void {
    if (user.id === this.currentUser()?.id) {
      this.notificationService.showError('You cannot disable your own account.');
      return;
    }
    
    this.authService.toggleUserStatus(user.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.users.update(users => users.map(u => u.id === user.id ? { ...u, disabled: !u.disabled } : u));
          const action = user.disabled ? 'enabled' : 'disabled';
          this.notificationService.showSuccess(`User ${action} successfully.`);
        }
      },
      error: (err) => this.notificationService.showError('Failed to update status.')
    });
  }

  updateRole(user: User, event: Event): void {
     const newRole = (event.target as HTMLSelectElement).value as UserRole;
     if (user.role === newRole) return;

     this.authService.updateUserRole(user.id, newRole).subscribe({
       next: (res) => {
         if (res.success) {
            this.users.update(users => users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
            this.notificationService.showSuccess('User role updated.');
         }
       },
       error: (err) => {
         this.notificationService.showError('Failed to update role.');
         // Revert UI if failed (simple reload for now)
         this.loadUsers(); 
       }
     });
  }

  logout(): void {
    this.authService.logout();
  }
}
