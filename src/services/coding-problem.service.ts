
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CodingProblem } from '../models/coding-problem.model';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CodingProblemService {
  private http = inject(HttpClient);
  private problems = signal<CodingProblem[]>([]);

  constructor() {
    this.fetchProblems();
  }

  private fetchProblems() {
    this.http.get<CodingProblem[]>('/api/coding/problems').pipe(
        tap(data => this.problems.set(data))
    ).subscribe();
  }

  getProblems() {
    return this.problems.asReadonly();
  }

  getProblemById(id: string) {
    return this.problems().find(p => p.id === id) || null;
  }
}
