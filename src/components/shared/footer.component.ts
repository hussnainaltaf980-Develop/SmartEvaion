import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  translationService = inject(TranslationService);
  currentYear = signal(new Date().getFullYear());
  contactEmail = signal('expert@officialhussnaintechcreat.site');
  contactPhone = signal('+923028808488');
  address = signal('Daska Sialkot Pakistan');

  availableLanguages = this.translationService.availableLanguages;
  currentLanguage = this.translationService.currentLanguage;

  onLanguageChange(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value;
    this.translationService.setLanguage(lang);
  }
}
