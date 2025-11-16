import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';

interface ConfettiPiece {
  left: string;
  animationDelay: string;
  duration: string;
  color: string;
}

@Component({
  selector: 'app-confetti',
  standalone: true,
  template: `
    <div class="confetti-container">
      @for (c of confetti(); track $index) {
        <div class="confetti" [style.left]="c.left" [style.animation-delay]="c.animationDelay" [style.animation-duration]="c.duration" [style.background-color]="c.color"></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfettiComponent implements OnInit {
  confetti = signal<ConfettiPiece[]>([]);
  private colors = ['#22D3EE', '#818CF8', '#FFFFFF', '#6A0DAD', '#ff3864', '#00f6ff'];

  ngOnInit(): void {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 150; i++) {
      pieces.push({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        duration: `${3 + Math.random() * 3}s`,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
      });
    }
    this.confetti.set(pieces);
  }
}
