import type { GrabResult } from '../core/types.js';

export async function copyToClipboard(result: GrabResult): Promise<boolean> {
  try {
    const items: Record<string, Blob> = {};

    items['text/plain'] = new Blob([result.text], { type: 'text/plain' });

    if (result.image) {
      const response = await fetch(result.image);
      const imageBlob = await response.blob();
      items['image/png'] = imageBlob;
    }

    await navigator.clipboard.write([
      new ClipboardItem(items),
    ]);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(result.text);
      return true;
    } catch {
      return false;
    }
  }
}
