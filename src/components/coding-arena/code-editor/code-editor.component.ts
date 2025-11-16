import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  input,
  output,
  effect,
} from '@angular/core';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  template: `<div #editorContainer class="w-full h-full rounded-lg overflow-hidden"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent implements AfterViewInit, OnDestroy {
  editorContainer = viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');

  initialCode = input<string>('');
  language = input<string>('typescript');
  
  codeChange = output<string>();

  private editor?: monaco.editor.IStandaloneCodeEditor;

  constructor() {
    effect(() => {
      const newCode = this.initialCode();
      if (this.editor && this.editor.getValue() !== newCode) {
        // Use a timeout to ensure this runs after the view is initialized if called early
        setTimeout(() => this.editor?.setValue(newCode), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.editorContainer()) {
      this.editor = monaco.editor.create(this.editorContainer().nativeElement, {
        value: this.initialCode(),
        language: this.language(),
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        padding: { top: 16 },
        wordWrap: 'on',
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        scrollBeyondLastLine: false,
      });

      this.editor.getModel()?.onDidChangeContent(() => {
        this.codeChange.emit(this.editor?.getValue() || '');
      });
    }
  }

  ngOnDestroy(): void {
    this.editor?.dispose();
  }
}
