
import { Injectable, signal, effect, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { tap, catchError, of, lastValueFrom, EMPTY, Subscription, finalize } from 'rxjs';
import { OverallEvaluation, EvaluationResult } from './gemini.service';
import { User, AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { SUPPRESS_ERROR_NOTIFICATION } from '../interceptors/error.interceptor';
import { LoadingService } from './loading.service';

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
export class InterviewService implements OnDestroy {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private webSocketService = inject(WebSocketService);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);

  private webSocketSub?: Subscription;
  private interviewsApiUrl = '/api/interviews';
  private sessionsApiUrl = '/api/sessions';

  interviewTemplates = signal<InterviewTemplate[]>([]);
  sessions = signal<InterviewSession[]>([]);
  
  activeQuestions = signal<string[]>([]);
  activeTemplate = signal<InterviewTemplate | null>(null);

  isFocusMode = signal<boolean>(false);

  constructor() {
    // Initial fetch
    this.fetchInterviewTemplates();
    this.fetchInterviewSessions();

    effect(() => {
        if (this.authService.isAuthenticated()) {
            this.webSocketSub?.unsubscribe();
            // The WebSocketService is connected from AppComponent, so we just subscribe.
            this.webSocketSub = this.webSocketService.messages$.subscribe(message => {
                this.handleWebSocketMessage(message);
            });
        } else {
            this.webSocketSub?.unsubscribe();
            this.webSocketSub = undefined;
        }
    });
  }

  ngOnDestroy(): void {
    this.webSocketSub?.unsubscribe();
  }

  private handleWebSocketMessage(message: any): void {
    if (message.type === 'answer_evaluation') {
        const payload = message.payload;
        this.sessions.update(sessions => {
            const sessionIndex = sessions.findIndex(s => s.id === payload.sessionId);
            if (sessionIndex > -1) {
                const updatedSessions = [...sessions];
                const updatedSession = { ...updatedSessions[sessionIndex] };
                const template = this.interviewTemplates().find(t => t.id === updatedSession.templateId);

                // Create the new result object
                const newResult: InterviewResult = {
                    sessionId: payload.sessionId,
                    questionId: payload.questionId,
                    questionText: payload.questionText,
                    transcript: payload.transcript,
                    evaluation: payload.evaluation,
                    answeredOn: new Date().toISOString(),
                    userName: updatedSession.userName,
                    jobTitle: updatedSession.jobTitle,
                    category: template?.category ?? 'N/A',
                    experienceLevel: template?.experienceLevel ?? 'N/A',
                    company: updatedSession.company
                };

                // Add the new result, avoiding duplicates
                const resultExists = updatedSession.results.some(r => r.questionId === newResult.questionId && r.transcript === newResult.transcript);
                if (!resultExists) {
                  updatedSession.results = [...updatedSession.results, newResult];
                  updatedSessions[sessionIndex] = updatedSession;
                  
                  this.notificationService.showSuccess(`Evaluation received for: "${payload.questionText.substring(0, 30)}..."`);
                  return updatedSessions;
                }
            }
            return sessions;
        });
    } else if (message.type === 'evaluation_error') {
        this.notificationService.showError(message.payload.message || 'An AI evaluation error occurred.');
    }
  }

  fetchInterviewTemplates(): void {
    // Only show loading if we don't have templates yet
    if(this.interviewTemplates().length === 0) {
        // Don't block UI globally for this background fetch, or use a very subtle indicator if desired
        // For now, we skip global loading to avoid flickering on dashboard load
    }
    
    this.http.get<InterviewTemplate[]>(this.interviewsApiUrl).pipe(
      tap(templates => this.interviewTemplates.set(templates)),
      catchError(error => {
        console.error('Failed to fetch interview templates:', error);
        this.interviewTemplates.set([]);
        return of([]); 
      })
    ).subscribe();
  }

  addInterviewTemplate(templateData: Omit<InterviewTemplate, 'id' | 'createdAt' | 'authorId' | 'authorName'>, author: User): void {
    this.loadingService.show('Creating new template...');
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
        console.error('Error creating template:', error);
        return EMPTY; 
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe();
  }

  deleteInterviewTemplate(templateId: string): void {
    this.loadingService.show('Deleting template...');
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
        console.error('Error deleting template:', error);
        return of(null); 
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe();
  }

  fetchInterviewSessions(): void {
    this.http.get<InterviewSession[]>(this.sessionsApiUrl).pipe(
      tap(sessions => this.sessions.set(sessions)),
      catchError(error => {
        console.error('Failed to fetch interview sessions:', error);
        this.sessions.set([]);
        return of([]); 
      })
    ).subscribe();
  }

  async startInterviewSession(templateId: string, user: User, title: string): Promise<string | null> {
    this.loadingService.show('Initializing interview session...');
    const template = this.interviewTemplates().find(t => t.id === templateId);
    if (!template || template.questions.length === 0) {
      this.activeQuestions.set([]);
      this.activeTemplate.set(null);
      this.notificationService.showError('Cannot start session: Template not found or has no questions.');
      this.loadingService.hide();
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
      console.error('Error starting session:', error);
      return null;
    } finally {
        this.loadingService.hide();
    }
  }

  async completeInterviewSession(sessionId: string, results: Omit<InterviewResult, 'answeredOn'>[], overallEvaluation: OverallEvaluation): Promise<void> {
    this.loadingService.show('Finalizing session results...');
    const sessionToUpdate = this.sessions().find(s => s.id === sessionId);
    if (!sessionToUpdate) {
        this.notificationService.showError("Session not found for completion.");
        this.loadingService.hide();
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
        console.error('Error completing session:', error);
    } finally {
        this.loadingService.hide();
    }
  }

  async updateSessionStatus(sessionId: string, newStatus: SessionStatus): Promise<void> {
    this.loadingService.show(`Updating session status to ${newStatus}...`);
    try {
      const updatedSessionResponse = await lastValueFrom(
        this.http.patch<{success: boolean; message: string; session: InterviewSession}>(`${this.sessionsApiUrl}/${sessionId}/status`, { status: newStatus })
      );
      this.sessions.update(sessions => sessions.map(s =>
        s.id === sessionId ? updatedSessionResponse.session : s
      ));
      this.notificationService.showSuccess(`Session status updated to ${newStatus}!`);
    } catch (error: any) {
      console.error('Error updating session status:', error);
      throw error;
    } finally {
        this.loadingService.hide();
    }
  }
}
