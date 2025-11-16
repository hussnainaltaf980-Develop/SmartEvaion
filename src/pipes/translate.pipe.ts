import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Important for reactivity, as translations can change
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private langChangeSub: Subscription;
  private translationsSub: Subscription;

  constructor() {
    // Subscribe to language changes to re-render components using this pipe
    this.langChangeSub = toObservable(this.translationService.currentLanguage).subscribe(() => {
      this.cdr.markForCheck();
    });
    // Also subscribe to the translations themselves to handle async loading
    this.translationsSub = toObservable(this.translationService.translations).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: { [key: string]: string | number }): string {
    // Always get the latest translation from the service.
    // The `pure: false` flag and constructor subscriptions handle re-evaluation.
    return this.translationService.getTranslation(key, params);
  }
  
  ngOnDestroy(): void {
    this.langChangeSub.unsubscribe();
    this.translationsSub.unsubscribe();
  }
}
