/**
 * Text recognition (OCR) for scanned or photographed CVs, with
 * tesseract.js running in the browser. The engine and English language
 * data (a few MB) are downloaded from a CDN the first time; the images
 * themselves never leave the device.
 */

export type Progress = (message: string) => void;

export async function recognise(images: (HTMLCanvasElement | Blob)[], progress: Progress = () => {}): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  let page = 0;
  progress('Loading text recognition (first time only)…');
  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') progress(`Reading text from ${images.length > 1 ? `page ${page + 1} of ${images.length}` : 'the image'}… ${Math.round(m.progress * 100)}%`);
    },
  });
  try {
    const texts: string[] = [];
    for (page = 0; page < images.length; page++) {
      const { data } = await worker.recognize(images[page]);
      texts.push(data.text);
    }
    return texts.join('\n\n');
  } finally {
    await worker.terminate();
  }
}
