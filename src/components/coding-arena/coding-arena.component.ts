import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CodingProblemService } from '../../services/coding-problem.service';
import {
  CodingProblem,
  SubmissionResult,
} from '../../models/coding-problem.model';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { ConfettiComponent } from '../shared/confetti.component';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

type ArenaView = 'description' | 'testCases';

@Component({
  selector: 'app-coding-arena',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CodeEditorComponent, ConfettiComponent],
  templateUrl: './coding-arena.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingArenaComponent implements OnInit, OnDestroy {
  codingProblemService = inject(CodingProblemService);
  http = inject(HttpClient);

  problems = this.codingProblemService.getProblems();
  selectedProblem = signal<CodingProblem | null>(null);
  userCode = signal<string>('');
  submissionResult = signal<SubmissionResult | null>(null);
  isRunning = signal(false);
  showConfetti = signal(false);

  rightPanelView = signal<ArenaView>('description');

  timer = signal<number>(0);
  private timerInterval: any;

  timerDisplay = computed(() => {
    const minutes = Math.floor(this.timer() / 60);
    const seconds = this.timer() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  });
  
  constructor() {
    effect(() => {
        if (this.submissionResult()?.success) {
            this.stopTimer();
            this.showConfetti.set(true);
            setTimeout(() => this.showConfetti.set(false), 6000);
        }
    });
  }

  ngOnInit(): void {
    // Select the first problem by default
    if (this.problems().length > 0) {
      this.selectProblem(this.problems()[0]);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timer.set(0);
    this.timerInterval = setInterval(() => {
      this.timer.update((t) => t + 1);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  selectProblem(problem: CodingProblem): void {
    this.selectedProblem.set(problem);
    this.userCode.set(problem.starterCode);
    this.submissionResult.set(null);
    this.rightPanelView.set('description');
    this.startTimer();
  }

  updateCode(code: string): void {
    this.userCode.set(code);
  }

  async handleSubmit(): Promise<void> {
    const problem = this.selectedProblem();
    if (!problem) return;

    this.isRunning.set(true);
    this.submissionResult.set(null);
    this.rightPanelView.set('testCases');

    try {
        const payload = {
            code: this.userCode(),
            testCases: problem.testCases,
            functionName: problem.solutionFunctionName
        };

        const result = await lastValueFrom(
            this.http.post<SubmissionResult>('/api/coding/execute', payload)
        );
        this.submissionResult.set(result);

    } catch (error: any) {
        this.submissionResult.set({
            success: false,
            message: error.error?.message || 'An unexpected error occurred.',
            results: []
        });
    } finally {
        this.isRunning.set(false);
    }
  }
}