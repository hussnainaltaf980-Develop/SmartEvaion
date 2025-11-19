
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';
import { lastValueFrom } from 'rxjs';

export type ChatMode = 'standard' | 'low-latency' | 'thinking';

export type ChatResponseChunk = {
  text: string;
  groundingUrls?: { uri: string; title?: string }[];
};

export interface TranscribeAudioResponse {
  transcript: string;
}

export interface MetricDetail {
  score: number;
  explanation: string;
  strengths?: string[];
  areasForImprovement?: string[];
}

export interface EvaluationMetrics {
  accuracy: MetricDetail;
  clarity: MetricDetail;
  confidence: MetricDetail;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  metrics: EvaluationMetrics;
}

export interface OverallEvaluation {
  overallFeedback?: string;
  strengths?: string[];
  areasForImprovement?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  private apiUrl = '/api/ai';

  constructor() {}

  async *chatWithAI(userMessage: string, mode: ChatMode, useGoogleSearch: boolean = false): AsyncIterable<ChatResponseChunk> {
    const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, mode, useGoogleSearch }),
    });

    if (!response.ok || !response.body) {
        const errorBody = await response.text();
        throw new Error(`Network response was not ok: ${response.statusText} - ${errorBody}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            if (buffer.trim()) {
                try {
                   yield JSON.parse(buffer) as ChatResponseChunk;
                } catch (e) {
                    console.error('Failed to parse final chunk of chat stream:', buffer);
                }
            }
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('|||');
        buffer = parts.pop() || '';

        for (const part of parts) {
            if (part.trim()) {
                try {
                    yield JSON.parse(part) as ChatResponseChunk;
                } catch (e) {
                    console.error('Failed to parse chunk of chat stream:', part);
                }
            }
        }
    }
  }

  async generateInterviewQuestions(jobTitle: string, category: string, experience: string, count: number): Promise<string[]> {
    this.loadingService.show();
    try {
      const response$ = this.http.post<string[]>(`${this.apiUrl}/generate-questions`, {
        jobTitle, category, experience, count
      });
      return await lastValueFrom(response$);
    } finally {
      this.loadingService.hide();
    }
  }

  async transcribeAudio(audioBase64: string): Promise<string> {
    this.loadingService.show();
    try {
      const response$ = this.http.post<TranscribeAudioResponse>(`${this.apiUrl}/transcribe-audio`, { audioBase64 });
      const response = await lastValueFrom(response$);
      return response.transcript;
    } finally {
      this.loadingService.hide();
    }
  }
}
