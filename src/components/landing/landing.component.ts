import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, effect, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../shared/header.component';
import { FooterComponent } from '../shared/footer.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface TourStep {
  title: string;
  text: string;
  selector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface Particle {
  left: string;
  animationDuration: string;
  animationDelay: string;
  opacity: number;
  width: string;
  height: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink, TranslatePipe, NgOptimizedImage],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  private router: Router = inject(Router);
  private document = inject(DOCUMENT);
  
  @ViewChild('parallaxContainer', { static: true }) parallaxContainer!: ElementRef<HTMLDivElement>;
  private backgroundAnimationEl: HTMLElement | null = null;

  flowingParticles = signal<Particle[]>([]);
  tourStep = signal(0); // 0 means tour is inactive

  readonly tourSteps: TourStep[] = [
    {
      selector: '#tour-step-1',
      title: 'Welcome to Evalion Vertex!',
      text: 'This is your AI-powered partner for interview preparation.',
      position: 'bottom',
    },
    {
      selector: '#tour-step-2',
      title: 'Core Features',
      text: 'Leverage Google Gemini for smart analysis, enjoy a responsive design, and track your progress with our analytics hub.',
      position: 'bottom',
    },
    {
      selector: '#tour-step-3',
      title: 'Start AI Interview',
      text: 'Click here to log in or sign up and begin your first practice session.',
      position: 'bottom',
    },
    {
        selector: '#tour-step-4',
        title: 'Mobile App Available',
        text: 'Practice on the go by downloading our app from the Google Play Store.',
        position: 'top',
    }
  ];

  tourContent = computed(() => this.tourStep() > 0 ? this.tourSteps[this.tourStep() - 1] : null);
  tourTooltipStyle = signal<{ [key: string]: string }>({});
  spotlightStyle = signal<{ [key: string]: string }>({});

  private updateTourPosition = () => {
    const content = this.tourContent();
    if (!content) return;

    const targetElement = this.document.querySelector<HTMLElement>(content.selector);
    if (!targetElement) {
      this.skipTour();
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 288; // 18rem
    
    let top = 0, left = 0;

    switch (content.position) {
        case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
        case 'top':
            top = rect.top - 180; // Approximate height of tooltip
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
        case 'left':
            // ...
            break;
        case 'right':
            // ...
            break;
    }

    // Boundary checks to keep tooltip on screen
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 10;


    this.tourTooltipStyle.set({
        top: `${top}px`,
        left: `${left}px`,
    });
    
    this.spotlightStyle.set({
      'left': `${rect.left - 4}px`,
      'top': `${rect.top - 4}px`,
      'width': `${rect.width + 8}px`,
      'height': `${rect.height + 8}px`,
      'box-shadow': '0 0 0 9999px rgba(0,0,0,0.6)',
      'border-radius': '8px',
      'transition': 'all 0.3s ease-in-out'
    });
  };

  constructor() {
    effect(() => {
        if (this.tourStep() > 0) {
            setTimeout(() => this.updateTourPosition(), 50);
        }
    });
  }
  
  ngAfterViewInit(): void {
    this.backgroundAnimationEl = this.document.getElementById('background-animation');
  }

  ngOnInit(): void {
    this.generateParticles();
    window.addEventListener('resize', this.updateTourPosition);
  }

  ngOnDestroy(): void {
      window.removeEventListener('resize', this.updateTourPosition);
  }
  
  onParallaxMouseMove(event: MouseEvent): void {
    if (!this.backgroundAnimationEl) return;

    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;

    const xPercent = (clientX / innerWidth - 0.5) * 2;
    const yPercent = (clientY / innerHeight - 0.5) * 2;
    
    const xOffset = -xPercent * 20; // Max 20px offset
    const yOffset = -yPercent * 20; // Max 20px offset

    this.backgroundAnimationEl.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
  }

  startTour(): void {
    this.tourStep.set(1);
  }

  nextStep(): void {
    if (this.tourStep() < this.tourSteps.length) {
      this.tourStep.update(s => s + 1);
    } else {
      this.skipTour();
    }
  }

  skipTour(): void {
    this.tourStep.set(0);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  private generateParticles(): void {
    const particles: Particle[] = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
      particles.push({
        left: `${Math.random() * 100}%`,
        animationDuration: `${5 + Math.random() * 10}s`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.5 + 0.2,
        width: `${1 + Math.random() * 2}px`,
        height: `${20 + Math.random() * 40}px`,
      });
    }
    this.flowingParticles.set(particles);
  }
}