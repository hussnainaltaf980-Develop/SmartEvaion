
import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

// Helper to flatten nested JSON e.g. { "common": { "welcome": "..." } } to { "common.welcome": "..." }
function flattenObject(obj: any, parentKey = '', result: { [key: string]: string } = {}): { [key: string]: string } {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], newKey, result);
            } else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private http = inject(HttpClient);
  private readonly LANG_STORAGE_KEY = 'evalion_language';

  currentLanguage = signal<string>('en'); // Default language
  availableLanguages = signal<{ code: string; name: string }[]>([
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'fr', name: 'Français' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' }
  ]);

  private translationsSignal = signal<{ [key: string]: string }>({});
  public translations = this.translationsSignal.asReadonly();

  constructor() {}

  private async loadTranslationsForLanguage(langCode: string): Promise<void> {
     try {
      // Use absolute path relative to root to ensure it loads from any route depth
      const path = `/src/assets/i18n/${langCode}.json`; 
      const translationData = await lastValueFrom(this.http.get<object>(path));
      const flattened = flattenObject(translationData);
      this.translationsSignal.set(flattened);
    } catch (e: any) {
        console.error(`Failed to load translations for ${langCode}:`, e);
        if (langCode !== 'en') {
            await this.loadTranslationsForLanguage('en');
        } else {
            this.translationsSignal.set({});
        }
    }
  }

  async loadAndSetLanguage(): Promise<void> {
    let langToSet = 'en';
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem(this.LANG_STORAGE_KEY);
      if (savedLang && this.availableLanguages().some(l => l.code === savedLang)) {
        langToSet = savedLang;
      } else {
        const browserLang = navigator.language.split('-')[0];
        const matchedLang = this.availableLanguages().find(l => l.code === browserLang);
        if (matchedLang) {
          langToSet = matchedLang.code;
        }
      }
    }
    await this.setLanguage(langToSet);
  }

  async setLanguage(langCode: string): Promise<void> {
    const supportedLang = this.availableLanguages().find(l => l.code === langCode);
    const langToLoad = supportedLang ? supportedLang.code : 'en';

    await this.loadTranslationsForLanguage(langToLoad);
    this.currentLanguage.set(langToLoad);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.LANG_STORAGE_KEY, langToLoad);
    }
  }

  getTranslation(key: string, params?: { [key: string]: any }): string {
    let translation = this.translationsSignal()[key] || key;

    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{{${paramKey}}}`, 'g');
        translation = translation.replace(regex, params[paramKey]);
      });
    }

    return translation;
  }
}
