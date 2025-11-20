
import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    // Configure marked to treat output as string synchronously if possible or handle promise
    // For simpler integration with the latest marked which might return a promise:
    // We use 'any' casting to workaround strict type checking if the library version varies.
    try {
        const parsed = marked.parse(value, { async: false }) as string;
        return this.sanitizer.bypassSecurityTrustHtml(parsed);
    } catch (e) {
        console.error("Markdown parsing error:", e);
        return value;
    }
  }
}
