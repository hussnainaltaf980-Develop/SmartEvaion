
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../shared/header.component';
import { FooterComponent } from '../shared/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen text-white flex flex-col bg-[#010A1A] font-sans">
      <app-header class="p-6"></app-header>
      <main class="flex-grow flex flex-col items-center justify-center p-6 animate-fade-in">
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
          <h1 class="text-3xl font-bold mb-4 text-center">Contact Us</h1>
          <p class="text-blue-200/70 text-center mb-8">Have questions or need support? Reach out to us.</p>
          
          <div class="space-y-4">
            <div class="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <div>
                <p class="text-xs text-blue-300/50 uppercase font-bold">Email</p>
                <p class="text-white">expert@officialhussnaintechcreat.site</p>
              </div>
            </div>

            <div class="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <div>
                <p class="text-xs text-blue-300/50 uppercase font-bold">Phone</p>
                <p class="text-white">+92 302 8808488</p>
              </div>
            </div>

            <div class="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <div>
                <p class="text-xs text-blue-300/50 uppercase font-bold">Location</p>
                <p class="text-white">Daska Sialkot, Pakistan</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {}
