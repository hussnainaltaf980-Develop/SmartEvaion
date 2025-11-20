
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { LoadingService } from './loading.service';

export type UserRole = 'candidate' | 'super-admin' | 'content-manager';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  fatherName?: string;
  dob?: string;
  cnic?: string;
  mobile?: string;
  photoUrl?: string; // Base64 or URL
  company?: string; // Company ID or name if multi-tenant
  disabled: boolean; // For user management
  companyName?: string; // For admin/content manager users
  companyLogo?: string; // For admin/content manager users
  companyRegistrationNumber?: string; // For admin/content manager users
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  user?: User; // For update/create responses
  users?: User[]; // For list responses
}

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router: Router = inject(Router);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  
  private authApiUrl = '/api/auth';
  private userApiUrl = '/api/users';

  private readonly TOKEN_KEY = 'evalion_auth_token';
  private readonly USER_KEY = 'evalion_session_user';

  currentUser = signal<User | null>(null);
  
  isAuthenticated = computed(() => !!this.currentUser());
  currentUserRole = computed(() => this.currentUser()?.role ?? null);
  currentUserName = computed(() => this.currentUser()?.name ?? null);
  currentUserEmail = computed(() => this.currentUser()?.email ?? null);
  currentUserCompany = computed(() => this.currentUser()?.company ?? null);
  currentUserCompanyName = computed(() => this.currentUser()?.companyName ?? null);


  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    const token = this.getToken();

    if (token) {
        const userJson = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);

        if (userJson) {
            try {
                const user: User = JSON.parse(userJson);
                if (user.disabled) {
                    this.logout();
                    this.notificationService.showError("Your account is disabled. Please contact an administrator.");
                    return;
                }
                this.currentUser.set(user);
            } catch (e) {
                console.error("Failed to parse user data from storage", e);
                this.logout();
            }
        } else {
            this.logout();
        }
    }
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
    this.loadingService.show('Authenticating credentials...');
    const loginPayload: LoginRequest = { email, password };

    return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, loginPayload).pipe(
      tap(response => {
        this.handleLoginSuccess(response, rememberMe);
      }),
      finalize(() => {
        this.loadingService.hide();
      })
    );
  }

  private handleLoginSuccess(response: AuthResponse, rememberMe: boolean): void {
     if (response.success && response.token && response.user) {
          // Clear any previous session data from both storages to prevent conflicts.
          localStorage.removeItem(this.TOKEN_KEY);
          localStorage.removeItem(this.USER_KEY);
          sessionStorage.removeItem(this.TOKEN_KEY);
          sessionStorage.removeItem(this.USER_KEY);
          
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem(this.TOKEN_KEY, response.token);
          storage.setItem(this.USER_KEY, JSON.stringify(response.user));
          this.currentUser.set(response.user);
          
          // Redirect based on role
          if (response.user.role === 'super-admin' || response.user.role === 'content-manager') {
             this.router.navigate(['/admin']);
          } else {
             this.router.navigate(['/candidate']);
          }
          
          this.notificationService.showSuccess('Login successful!');
        }
  }

  signUp(userData: Omit<User, 'id' | 'disabled'>): Observable<ApiResponse> {
     this.loadingService.show('Creating your account...');
     return this.http.post<ApiResponse>(`${this.authApiUrl}/register`, userData).pipe(
       finalize(() => this.loadingService.hide())
     );
  }

  logout(): void {
    this.loadingService.show('Securely logging out...');
    // Simulate a short delay for UX smoothness
    setTimeout(() => {
      this.currentUser.set(null);
      if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.TOKEN_KEY);
          localStorage.removeItem(this.USER_KEY);
          sessionStorage.removeItem(this.TOKEN_KEY);
          sessionStorage.removeItem(this.USER_KEY);
      }
      this.router.navigate(['/login']);
      this.loadingService.hide();
    }, 800);
  }
  
  // Admin-specific methods
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userApiUrl);
  }

  createUser(userData: Omit<User, 'id' | 'disabled'>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.userApiUrl, userData);
  }

  updateUserProfile(updatedData: Partial<User>): Observable<ApiResponse> {
    const userId = this.currentUser()?.id;
    if (!userId) {
      this.notificationService.showError("Not logged in to update profile.");
      return of({ success: false, message: "Not logged in" });
    }
    this.loadingService.show('Updating profile...');
    return this.http.put<ApiResponse>(`${this.userApiUrl}/${userId}`, updatedData).pipe(
      tap(response => {
        if (response.success && response.user) {
          this.currentUser.set(response.user);
          // Also update storage
          const storage = localStorage.getItem(this.TOKEN_KEY) ? localStorage : sessionStorage;
          storage.setItem(this.USER_KEY, JSON.stringify(response.user));
        }
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  toggleUserStatus(userId: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.userApiUrl}/${userId}/status`, {}).pipe(
      tap(response => {
        if (response.success && response.user) {
          if (this.currentUser()?.id === userId && response.user.disabled) {
            this.logout(); 
            this.notificationService.showInfo("Your account has been disabled.");
          }
        }
      })
    );
  }

  updateUserRole(userId: string, newRole: UserRole): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.userApiUrl}/${userId}/role`, { newRole }).pipe(
      tap(response => {
        if (response.success && response.user) {
          if (this.currentUser()?.id === userId) {
            this.currentUser.update(u => u ? { ...u, role: response.user!.role } : null);
             const storage = localStorage.getItem(this.TOKEN_KEY) ? localStorage : sessionStorage;
            storage.setItem(this.USER_KEY, JSON.stringify(this.currentUser()));
          }
        }
      })
    );
  }
}
