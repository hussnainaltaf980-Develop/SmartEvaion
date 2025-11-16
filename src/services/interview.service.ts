import { Injectable, signal, effect, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of, lastValueFrom, EMPTY } from 'rxjs';
import { OverallEvaluation, EvaluationResult } from './gemini.service';
import { User } from './auth.service';
import { NotificationService } from './notification.service';

export type InterviewTemplateType = 'technical' | 'behavioral' | 'situational' | 'general';
export type SessionStatus = 'pending' | 'approved' | 'rejected';

export interface InterviewTemplate {
  id: string; // From backend _id
  jobTitle: string;
  category: string;
  experienceLevel: string;
  questions: string[];
  createdAt: string; // ISO string date
  type: InterviewTemplateType;
  company?: string;
  authorId?: string; // string from ObjectId
  authorName?: string;
}

export interface InterviewResult {
  sessionId: string;
  questionId: string; 
  questionText: string;
  transcript: string;
  evaluation: EvaluationResult;
  answeredOn: string; // ISO string date
  userName: string;
  jobTitle: string;
  category: string;
  experienceLevel: string;
  company?: string;
  videoUrl?: string;
}

export interface InterviewSession {
    id: string; // From backend _id
    title: string;
    userId: string; 
    userName: string;
    templateId: string;
    jobTitle: string; 
    company?: string;
    status: SessionStatus;
    overallScore?: number;
    startedAt: string; // ISO string date
    completedAt?: string; // ISO string date
    overallFeedback?: string;
    overallStrengths?: string[];
    overallAreasForImprovement?: string[];
    results: InterviewResult[]; 
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  private interviewsApiUrl = '/api/interviews';
  private sessionsApiUrl = '/api/sessions';

  interviewTemplates = signal<InterviewTemplate[]>([]);
  sessions = signal<InterviewSession[]>([]);
  
  activeQuestions = signal<string[]>([]);
  activeTemplate = signal<InterviewTemplate | null>(null);

  isFocusMode = signal<boolean>(false);

  constructor() {
    this.fetchInterviewTemplates();
    this.fetchInterviewSessions();
  }

  fetchInterviewTemplates(): void {
    this.http.get<InterviewTemplate[]>(this.interviewsApiUrl).pipe(
      tap(templates => this.interviewTemplates.set(templates)),
      catchError(error => {
        // The error interceptor will show a notification.
        console.error('Failed to fetch interview templates:', error);
        return of([]); 
      })
    ).subscribe();
  }

  addInterviewTemplate(templateData: Omit<InterviewTemplate, 'id' | 'createdAt' | 'authorId' | 'authorName'>, author: User): void {
    const newTemplatePayload = {
      ...templateData,
      authorId: author.id,
      authorName: author.name,
    };

    this.http.post<InterviewTemplate>(this.interviewsApiUrl, newTemplatePayload).pipe(
      tap(savedTemplate => {
        if (savedTemplate) {
          this.interviewTemplates.update(templates => [...templates, savedTemplate]);
          this.notificationService.showSuccess('Interview template created successfully!');
        }
      }),
      catchError(error => {
        // Interceptor will handle the notification
        console.error('Error creating template:', error);
        return EMPTY; 
      })
    ).subscribe();
  }

  deleteInterviewTemplate(templateId: string): void {
    this.http.delete<{success: boolean, message: string}>(`${this.interviewsApiUrl}/${templateId}`).pipe(
      tap((response) => {
        if (response.success) {
            const deletedTemplate = this.interviewTemplates().find(t => t.id === templateId);
            this.interviewTemplates.update(templates => templates.filter(t => t.id !== templateId));
            if(deletedTemplate) {
               this.notificationService.showSuccess(`Template '${deletedTemplate.jobTitle}' deleted successfully!`);
            }
        }
      }),
      catchError(error => {
        // Interceptor will handle the notification
        console.error('Error deleting template:', error);
        return of(null); 
      })
    ).subscribe();
  }

  fetchInterviewSessions(): void {
    this.http.get<InterviewSession[]>(this.sessionsApiUrl).pipe(
      tap(sessions => this.sessions.set(sessions)),
      catchError(error => {
        console.error('Failed to fetch interview sessions:', error);
        return of([]); 
      })
    ).subscribe();
  }

  async startInterviewSession(templateId: string, user: User, title: string): Promise<string | null> {
    const template = this.interviewTemplates().find(t => t.id === templateId);
    if (!template || template.questions.length === 0) {
      this.activeQuestions.set([]);
      this.activeTemplate.set(null);
      this.notificationService.showError('Cannot start session: Template not found or has no questions.');
      return null;
    }

    const newSessionPayload = {
      templateId: template.id,
      title,
      userId: user.id,
      userName: user.name,
      jobTitle: template.jobTitle,
      company: template.company || user.company,
      questions: template.questions,
    };

    try {
      const createdSession = await lastValueFrom(
        this.http.post<InterviewSession>(this.sessionsApiUrl, newSessionPayload)
      );
      this.sessions.update(sessions => [...sessions, createdSession]);
      this.activeQuestions.set(template.questions);
      this.activeTemplate.set(template);
      this.isFocusMode.set(true);
      return createdSession.id;
    } catch (error: any) {
      // Interceptor handles notification
      console.error('Error starting session:', error);
      return null;
    }
  }

  async completeInterviewSession(sessionId: string, results: Omit<InterviewResult, 'answeredOn'>[], overallEvaluation: OverallEvaluation): Promise<void> {
    const sessionToUpdate = this.sessions().find(s => s.id === sessionId);
    if (!sessionToUpdate) {
        this.notificationService.showError("Session not found for completion.");
        console.error("Session not found for completion:", sessionId);
        return;
    }

    const finalResults: InterviewResult[] = results.map(r => ({ ...r, answeredOn: new Date().toISOString() }));

    const completionPayload = {
        results: finalResults,
        overallFeedback: overallEvaluation.overallFeedback,
        overallStrengths: overallEvaluation.strengths,
        overallAreasForImprovement: overallEvaluation.areasForImprovement,
    };

    try {
        const updatedSessionResponse = await lastValueFrom(
            this.http.put<{success: boolean; message: string; session: InterviewSession}>(`${this.sessionsApiUrl}/${sessionId}/complete`, completionPayload)
        );
        this.sessions.update(sessions => sessions.map(s => s.id === sessionId ? updatedSessionResponse.session : s));
        this.activeQuestions.set([]);
        this.activeTemplate.set(null);
        this.isFocusMode.set(false);
        this.notificationService.showSuccess('Interview session completed and results saved!');
    } catch (error: any) {
        this.isFocusMode.set(false);
        // Interceptor handles notification
        console.error('Error completing session:', error);
    }
  }

  async updateSessionStatus(sessionId: string, newStatus: SessionStatus): Promise<void> {
    try {
      const updatedSessionResponse = await lastValueFrom(
        this.http.patch<{success: boolean; message: string; session: InterviewSession}>(`${this.sessionsApiUrl}/${sessionId}/status`, { status: newStatus })
      );
      this.sessions.update(sessions => sessions.map(s =>
        s.id === sessionId ? updatedSessionResponse.session : s
      ));
      this.notificationService.showSuccess(`Session status updated to ${newStatus}!`);
    } catch (error: any) {
      // Interceptor handles notification
      console.error('Error updating session status:', error);
      throw error;
    }
  }
}
