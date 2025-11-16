import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, of, catchError } from 'rxjs';
import { EvaluationResult, OverallEvaluation } from './gemini.service';
import { LoadingService } from './loading.service';
import { InterviewResult } from './interview.service';
import { NotificationService } from './notification.service';

export interface EvaluationRequest {
  question: string;
  answerText: string;
  interviewId: string; // Or some identifier for the session/template
  sessionId: string;
  questionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiEvaluationService {
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private apiUrl = '/api/ai';

  evaluateAnswer(data: EvaluationRequest): Observable<void> {
    // This is now a fire-and-forget request. The backend will respond with 202 Accepted.
    // The result will be pushed via WebSocket.
    this.loadingService.show();
    return this.http.post<void>(`${this.apiUrl}/evaluate-answer`, data).pipe(
      catchError(err => {
        // The interceptor will show a notification, but we catch it here to prevent
        // the error from propagating further and causing an unhandled rejection in the component.
        console.error("Error initiating evaluation:", err);
        return of(undefined as void); // Return a completed observable
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  evaluateOverallSession(results: Omit<InterviewResult, 'answeredOn'>[]): Observable<void> {
    // This is also a fire-and-forget request.
    this.loadingService.show();
    return this.http.post<void>(`${this.apiUrl}/evaluate-session`, { results }).pipe(
        catchError(err => {
            console.error("Error initiating overall evaluation:", err);
            return of(undefined as void);
        }),
        finalize(() => this.loadingService.hide())
    );
  }
}
