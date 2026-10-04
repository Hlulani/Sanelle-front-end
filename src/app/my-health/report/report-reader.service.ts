import { Injectable } from '@angular/core';

export interface ReportRegion { text: string; x: number; y: number; width: number; height: number; }
export interface ReportPreview { text: string; url: string; width: number; height: number; regions: ReportRegion[]; }

/** Report bytes are processed in this browser/WebView and are never uploaded. */
@Injectable({ providedIn: 'root' })
export class ReportReader {
  async read(file: File, progress: (message: string) => void, preview?: (page: ReportPreview) => void): Promise<string> {
    if (file.size > 20 * 1024 * 1024) throw new Error('Choose a file smaller than 20 MB. You can photograph one page at a time.');
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf && !/^image\//.test(file.type)) throw new Error('Choose a PDF or a photo of your report.');
    const workerRef: { current: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | null } = { current: null };
    const recognize = async (image: HTMLCanvasElement) => {
      if (!workerRef.current) {
        progress('Preparing the report reader…');
        // Production bundles expose this CommonJS package through its default export.
        const tesseract = await import('tesseract.js');
        const { createWorker } = tesseract.default ?? tesseract;
        workerRef.current = await createWorker('eng', 1, {
          workerBlobURL: false,
          workerPath: new URL('assets/ocr/worker.min.js', document.baseURI).href,
          corePath: new URL('assets/ocr/', document.baseURI).href,
          langPath: new URL('assets/ocr/', document.baseURI).href,
          logger: (event) => {
            if (event.status === 'recognizing text') progress(`Reading text… ${Math.round(event.progress * 100)}%`);
          },
        });
      }
      const data = (await workerRef.current.recognize(image, {}, { blocks: true })).data;
      const regions: ReportRegion[] = [];
      for (const block of data.blocks ?? []) for (const paragraph of block.paragraphs) for (const line of paragraph.lines) {
        regions.push({ text: line.text, x: line.bbox.x0, y: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 });
      }
      await showPreview(image, data.text, regions);
      return data.text;
    };
    const showPreview = async (canvas: HTMLCanvasElement, text: string, regions: ReportRegion[]) => {
      if (!preview) return;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (blob) preview({ text, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, regions });
    };
    try {
      if (!isPdf) {
        progress('Opening your photo…');
        const bitmap = await createImageBitmap(file).catch(() => {
          throw new Error('This photo could not be opened. Try a JPG or PNG, or a PDF of the report.');
        });
        try {
          const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(bitmap.width * scale);
          canvas.height = Math.round(bitmap.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('The report reader isn’t available here. You can add details manually.');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          return await recognize(canvas);
        } finally {
          bitmap.close();
        }
      }
      progress('Opening your PDF…');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('assets/pdf/pdf.worker.min.mjs', document.baseURI).href;
      const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        useSystemFonts: true,
        wasmUrl: new URL('assets/pdf/wasm/', document.baseURI).href,
        standardFontDataUrl: new URL('assets/pdf/fonts/', document.baseURI).href,
      });
      try {
        const pdf = await task.promise;
        if (pdf.numPages > 10) throw new Error('Choose a report with 10 pages or fewer, or photograph the relevant page.');
        const pages: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          progress(`Reading page ${n} of ${pdf.numPages}…`);
          const page = await pdf.getPage(n);
          const content = await page.getTextContent();
          let text = content.items.map((item) => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
          if (text.trim().length < 30 || preview) {
            const initial = page.getViewport({ scale: 1 });
            const scale = Math.min(2, 2200 / Math.max(initial.width, initial.height));
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            await page.render({ canvas, viewport }).promise;
            if (text.trim().length < 30) text = await recognize(canvas);
            else {
              const regions: ReportRegion[] = [];
              for (const item of content.items) if ('str' in item && item.str.trim()) {
                const transform = pdfjs.Util.transform(viewport.transform, item.transform);
                const height = Math.hypot(transform[2], transform[3]);
                regions.push({ text: item.str, x: transform[4], y: transform[5] - height, width: item.width * scale, height: height * 1.2 });
              }
              await showPreview(canvas, text, regions);
            }
          }
          pages.push(text);
          page.cleanup();
        }
        return pages.join('\n\n');
      } catch (error) {
        if (error instanceof Error && error.name === 'PasswordException') throw new Error('This PDF is password protected. Use an unlocked copy or photograph the report.');
        throw error;
      } finally {
        await task.destroy();
      }
    } finally {
      if (workerRef.current) await workerRef.current.terminate();
    }
  }
}
