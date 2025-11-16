import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../services/loading.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  loadingService = inject(LoadingService);
  isLoading = this.loadingService.isLoading;
}
