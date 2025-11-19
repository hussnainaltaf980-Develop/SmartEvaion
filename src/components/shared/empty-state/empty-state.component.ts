
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div class="w-20 h-20 rounded-full bg-surface border border-border-primary flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
        @if (icon()) {
           <div [innerHTML]="icon()" class="w-10 h-10 text-text-muted"></div>
        } @else {
           <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
             <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
           </svg>
        }
      </div>
      <h3 class="text-xl font-bold text-text-primary mb-2">{{ title() }}</h3>
      <p class="text-text-secondary max-w-md mb-6">{{ message() }}</p>
      
      @if (actionLabel()) {
        <button (click)="onAction()" class="bg-gradient-to-r from-primary-accent to-secondary-accent text-bg-primary font-bold py-2 px-6 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 focus:ring-offset-bg-primary">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  title = input.required<string>();
  message = input.required<string>();
  icon = input<string>(); // SVG string
  actionLabel = input<string>();
  action = output<void>();

  onAction(): void {
    this.action.emit();
  }
}
