import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" (click)="onCancel()">
      <div class="bg-indigo-900/80 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-indigo-500/20 w-full max-w-md m-4" (click)="$event.stopPropagation()">
        <div class="p-6">
          <h3 class="text-xl font-bold text-white mb-2">{{ title() | translate }}</h3>
          <p class="text-indigo-200">{{ message() | translate }}</p>
        </div>
        <div class="bg-indigo-900/50 p-4 flex justify-end gap-4 rounded-b-2xl">
          <button (click)="onCancel()" class="bg-transparent border border-indigo-500 hover:bg-indigo-900/30 text-white font-bold py-2 px-4 rounded-full transition-all">
            {{ 'common.cancel' | translate }}
          </button>
          <button (click)="onConfirm()" class="bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-700 hover:to-purple-800 text-white font-bold py-2 px-4 rounded-full transition-all">
            {{ 'common.confirm' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirm = output<void>();
  cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
