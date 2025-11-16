import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { GlobalErrorHandlerService } from './src/services/global-error-handler.service';
import { authInterceptor } from './src/interceptors/auth.interceptor';
import { errorInterceptor } from './src/interceptors/error.interceptor';

// CRITICAL: Configure Monaco Environment for workers globally and early
// This must be done BEFORE Monaco's modules are loaded by the browser/importmap.
// Ensure the version used here matches the one specified in index.html's importmap.
if (typeof (self as any).MonacoEnvironment === 'undefined') {
  const cdnBase = 'https://next.esm.sh/monaco-editor@0.54.0/esm/vs';

  (self as any).MonacoEnvironment = {
    getWorker: (_moduleId: any, label: string) => {
      let workerPath;

      if (label === 'json') {
        workerPath = `${cdnBase}/language/json/json.worker.js`;
      } else if (label === 'css' || label === 'scss' || label === 'less') {
        workerPath = `${cdnBase}/language/css/css.worker.js`;
      } else if (label === 'html' || label === 'handlebars' || label === 'razor') {
        workerPath = `${cdnBase}/language/html/html.worker.js`;
      } else if (label === 'typescript' || label === 'javascript') {
        workerPath = `${cdnBase}/language/typescript/ts.worker.js`;
      } else {
        workerPath = `${cdnBase}/editor/editor.worker.js`;
      }

      // The "Could not create web worker" error happens because the worker scripts from esm.sh are ES modules.
      // By implementing `getWorker`, we gain control over the worker's instantiation
      // and can explicitly create it with `{ type: 'module' }`, which is the correct way to load ES module workers.
      return new Worker(workerPath, { type: 'module' });
    },
  };
}


bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
  ],
}).catch((err) => console.error(err));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// AI Studio always uses an `index.tsx` file for all project types.