import { Injectable, signal } from '@angular/core';
import { ReportSource } from '../diagnosis.model';
import { PageQuality } from './page-quality';

export interface DraftPage {
  id: string;
  file: File;
  /** An object URL for the thumbnail; released when the page is removed or the draft cleared. */
  url: string;
  quality: PageQuality | null;
}

/**
 * The pages chosen for one report, held in memory only while she captures and checks them.
 * Report files are never saved: only the details she checks are kept.
 */
@Injectable({ providedIn: 'root' })
export class ReportDraft {
  readonly source = signal<ReportSource>('manual');
  readonly pages = signal<DraftPage[]>([]);

  start(source: ReportSource, files: File[] = []): void {
    this.clear();
    this.source.set(source);
    this.pages.set(files.map((file) => this.page(file)));
  }

  add(file: File): DraftPage {
    const page = this.page(file);
    this.pages.update((pages) => [...pages, page]);
    return page;
  }

  replace(id: string, file: File): DraftPage {
    const page = this.page(file);
    this.pages.update((pages) =>
      pages.map((p) => {
        if (p.id !== id) return p;
        URL.revokeObjectURL(p.url);
        return page;
      }),
    );
    return page;
  }

  setQuality(id: string, quality: PageQuality): void {
    this.pages.update((pages) => pages.map((p) => (p.id === id ? { ...p, quality } : p)));
  }

  remove(id: string): void {
    this.pages.update((pages) =>
      pages.filter((p) => {
        if (p.id === id) URL.revokeObjectURL(p.url);
        return p.id !== id;
      }),
    );
  }

  move(id: string, delta: -1 | 1): void {
    this.pages.update((pages) => {
      const list = [...pages];
      const i = list.findIndex((p) => p.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return pages;
      [list[i], list[j]] = [list[j], list[i]];
      return list;
    });
  }

  clear(): void {
    this.pages().forEach((p) => URL.revokeObjectURL(p.url));
    this.pages.set([]);
    this.source.set('manual');
  }

  private page(file: File): DraftPage {
    const url = /^image\//.test(file.type) ? URL.createObjectURL(file) : '';
    return { id: Math.random().toString(36).slice(2, 10), file, url, quality: null };
  }
}
