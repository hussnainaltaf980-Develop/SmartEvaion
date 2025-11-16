import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { LoginComponent } from './components/login/login.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignupComponent } from './components/signup/signup.component';
import { interviewInProgressGuard } from './guards/interview-in-progress.guard';

export const APP_ROUTES: Routes = [
  { path: 'landing', component: LandingComponent, canActivate: [publicGuard] },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [publicGuard] },
  { 
    path: 'candidate', 
    loadComponent: () => import('./components/candidate-dashboard/candidate-dashboard.component').then(m => m.CandidateDashboardComponent),
    canActivate: [authGuard],
    canDeactivate: [interviewInProgressGuard],
    data: { roles: ['candidate'] } 
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['super-admin', 'content-manager'] }
  },
  {
    path: 'analytics',
    loadComponent: () => import('./components/analytics-dashboard/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'certificate/:sessionId', 
    loadComponent: () => import('./components/certificate/certificate.component').then(m => m.CertificateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent)
  },
  // Redirect to landing page by default
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  // Wildcard route for a 404 page or redirect
  { path: '**', redirectTo: '/landing' }
];
