import { ChangeDetectionStrategy, Component, signal, inject, ViewChild, ElementRef, effect, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, ChatMode, ChatResponseChunk } from '../../services/gemini.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  isTyping?: boolean;
  isError?: boolean;
  groundingUrls?: { uri: string; title?: string }[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  templateUrl: './chatbot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe]
})
export class ChatbotComponent implements AfterViewInit, OnDestroy, OnInit {
  geminiService = inject(GeminiService);
  authService = inject(AuthService);
  translationService = inject(TranslationService);
  private notificationService = inject(NotificationService);

  @ViewChild('chatHistory', { static: false }) chatHistory!: ElementRef<HTMLDivElement>;

  messages = signal<ChatMessage[]>([]);
  chatInput = signal('');
  isLoading = signal(false);
  isChatOpen = signal(false);
  chatMode = signal<ChatMode>('standard');
  useGoogleSearch = signal<boolean>(false);

  private resizeObserver: ResizeObserver | null = null;
  private readonly CHAT_HISTORY_KEY_PREFIX = 'evalion_chat_history_';
  private currentUserChatKey = signal<string>('');

  constructor() {
    effect(() => {
      this.messages(); 
      if (this.isChatOpen()) {
        queueMicrotask(() => this.scrollToBottom());
      }
    });
    
    effect(() => {
      const key = this.currentUserChatKey();
      const currentMessages = this.messages();
      if (key && currentMessages.length > 0) {
        localStorage.setItem(key, JSON.stringify(currentMessages));
      }
    });

    effect(() => {
      this.translationService.currentLanguage();
      const currentMessages = this.messages();
      if (currentMessages.length === 1 && (currentMessages[0].id === -1 || currentMessages[0].id === -2)) {
         this.setDefaultMessage();
      }
    });
  }
  
  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentUserChatKey.set(`${this.CHAT_HISTORY_KEY_PREFIX}${currentUser.id}`);
      this.loadChatHistory();
    } else {
      this.setDefaultMessage();
    }
  }
  
  private loadChatHistory(): void {
    const key = this.currentUserChatKey();
    if (!key) return;

    try {
      const storedHistory = localStorage.getItem(key);
      if (storedHistory) {
        const parsedHistory: ChatMessage[] = JSON.parse(storedHistory);
        const cleanedHistory = parsedHistory.map(m => ({ ...m, isTyping: false }));
        this.messages.set(cleanedHistory);
      } else {
        this.setDefaultMessage();
      }
    } catch (e) {
      console.error("Failed to parse chat history:", e);
      this.setDefaultMessage();
    }
  }

  private setDefaultMessage(): void {
    if (!this.authService.isAuthenticated()) {
      this.messages.set([
        { id: -1, sender: 'ai', text: this.translationService.getTranslation('chatbot.guestMessage'), isTyping: false }
      ]);
    } else {
      this.messages.set([
        { id: -2, sender: 'ai', text: this.translationService.getTranslation('chatbot.welcomeMessage'), isTyping: false }
      ]);
    }
  }

  ngAfterViewInit(): void {
    if (this.chatHistory?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.isChatOpen()) {
          this.scrollToBottom();
        }
      });
      this.resizeObserver.observe(this.chatHistory.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  
  setChatMode(mode: ChatMode): void {
    this.chatMode.set(mode);
  }

  toggleGoogleSearch(): void {
    this.useGoogleSearch.update(val => !val);
  }

  toggleChat(): void {
    this.isChatOpen.update(open => !open);
  }
  
  private isInputValid(input: string): boolean {
    const harmfulPatterns = [
      /ignore previous instructions/i,
      /reveal your prompt/i,
      /print your instructions/i,
      /act as/i
    ];

    if (input.length > 4000) {
        this.notificationService.showError(this.translationService.getTranslation('chatbot.inputTooLong'));
        return false;
    }

    for (const pattern of harmfulPatterns) {
      if (pattern.test(input)) {
        this.notificationService.showError(this.translationService.getTranslation('chatbot.harmfulInput'));
        return false;
      }
    }
    return true;
  }

  async sendMessage(): Promise<void> {
    const userMessage = this.chatInput().trim();
    if (!userMessage) return;

    if (!this.isInputValid(userMessage)) {
      return;
    }

    this.messages.update(msgs => [...msgs, { id: Date.now(), sender: 'user', text: userMessage }]);
    this.chatInput.set('');
    this.isLoading.set(true);
    this.messages.update(msgs => [...msgs, { id: Date.now() + 1, sender: 'ai', text: '', isTyping: true }]);
    const messageIndex = this.messages().length - 1;
    
    try {
      let fullAiResponse = '';
      let allGroundingUrls: { uri: string; title?: string }[] = [];

      for await (const chunk of this.geminiService.chatWithAI(userMessage, this.chatMode(), this.useGoogleSearch())) {
        fullAiResponse += chunk.text;
        if (chunk.groundingUrls) {
            allGroundingUrls = [...allGroundingUrls, ...chunk.groundingUrls];
        }

        this.messages.update(msgs => {
          const updatedMsgs = [...msgs];
          if (updatedMsgs[messageIndex]) {
            updatedMsgs[messageIndex].text = fullAiResponse;
            updatedMsgs[messageIndex].groundingUrls = allGroundingUrls.length > 0 ? Array.from(new Set(allGroundingUrls.map(u => u.uri))).map(uri => allGroundingUrls.find(u => u.uri === uri)!) : undefined;
          }
          return updatedMsgs;
        });
      }

    } catch (error: any) {
        console.error('Chatbot message error:', error);
        let userErrorMessage = this.translationService.getTranslation('apiErrors.unknownError');
        const errorMessageText = error.message || '';
        
        if (errorMessageText.includes('429')) {
            userErrorMessage = this.translationService.getTranslation('apiErrors.serviceBusy');
        } else if (errorMessageText.includes('500') || errorMessageText.includes('503')) {
            userErrorMessage = this.translationService.getTranslation('apiErrors.serverError');
        } else if (errorMessageText.includes('400')) {
            userErrorMessage = this.translationService.getTranslation('apiErrors.invalidRequest');
        } else if (errorMessageText.includes('Network response was not ok')) {
            userErrorMessage = this.translationService.getTranslation('apiErrors.networkError');
        } else if (errorMessageText.includes('SAFETY')) {
            userErrorMessage = this.translationService.getTranslation('apiErrors.contentBlocked');
        } else if (errorMessageText.includes('API_KEY')) {
            userErrorMessage = this.translationService.getTranslation('apiErrors.apiKeyInvalid');
        }

        this.messages.update(msgs => {
            const updatedMsgs = [...msgs];
            if (updatedMsgs[messageIndex]) {
                updatedMsgs[messageIndex] = {
                    ...updatedMsgs[messageIndex],
                    text: userErrorMessage,
                    isError: true,
                };
            }
            return updatedMsgs;
        });
    } finally {
      this.isLoading.set(false);
      this.messages.update(msgs => {
        const updatedMsgs = [...msgs];
        if (updatedMsgs[messageIndex]) {
          updatedMsgs[messageIndex].isTyping = false;
        }
        return updatedMsgs;
      });
    }
  }

  private scrollToBottom(): void {
    if (this.chatHistory?.nativeElement) {
      try {
        this.chatHistory.nativeElement.scroll({
          top: this.chatHistory.nativeElement.scrollHeight,
          behavior: 'smooth'
        });
      } catch (err) {
        console.warn('Could not scroll chat history:', err);
      }
    }
  }
}
