import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-theme-customizer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './theme-customizer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeCustomizerComponent {
  themeService = inject(ThemeService);
  themes = this.themeService.themes;
  activeThemeName = this.themeService.activeThemeName;
  customColors = this.themeService.customColors;
  mode = this.themeService.mode;
  
  handlePrimaryAccentChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.themeService.setCustomColor('primary', value);
  }

  handleSecondaryAccentChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.themeService.setCustomColor('secondary', value);
  }
}
