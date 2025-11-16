import { Injectable, inject, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, tap, catchError, EMPTY, retry, timer, delayWhen } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  public socket$?: WebSocketSubject<any>;
  private messagesSubject = new Subject<any>();

  public messages$ = this.messagesSubject.asObservable();

  get socketInitialized(): boolean {
    return !!this.socket$;
  }

  get socketClosed(): boolean {
    return this.socket$ ? this.socket$.closed : true;
  }

  public connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('WebSocket: No auth token found.');
      return;
    }

    if (this.socket$ && !this.socket$.closed) {
      return; // Already connected
    }

    const protocol = window.location.protocol === 'https' ? 'wss' : 'ws';
    const host = window.location.host; 
    
    this.socket$ = webSocket({
      url: `${protocol}://${host}/?token=${token}`,
      openObserver: {
        next: () => console.log('WebSocket connection established.'),
      },
      closeObserver: {
        next: (e) => console.log('WebSocket connection closed:', e),
      }
    });

    this.socket$.pipe(
      retry({ 
        delay: (error, retryCount) => {
          console.warn(`WebSocket connection attempt ${retryCount} failed. Retrying in 5s...`, error);
          this.notificationService.showInfo('Reconnecting to live feedback server...');
          return timer(5000);
        }
      }),
      catchError(error => {
        console.error('WebSocket connection failed permanently after retries:', error);
        this.notificationService.showError('Could not establish a connection for live feedback.');
        return EMPTY;
      })
    ).subscribe(message => this.messagesSubject.next(message));
  }

  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
