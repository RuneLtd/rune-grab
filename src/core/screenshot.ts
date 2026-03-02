type CaptureProvider = (rect: DOMRect) => Promise<string | null>;
let customProvider: CaptureProvider | null = null;

export function setCaptureProvider(provider: CaptureProvider): void {
  customProvider = provider;
}

let activeStream: MediaStream | null = null;

async function getStream(): Promise<MediaStream | null> {
  if (activeStream) {
    const tracks = activeStream.getVideoTracks();
    if (tracks.length > 0 && tracks[0].readyState === 'live') {
      return activeStream;
    }
    activeStream = null;
  }

  try {
    activeStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        preferCurrentTab: true,
      } as any,
      audio: false,
    });

    activeStream!.getVideoTracks()[0].addEventListener('ended', () => {
      activeStream = null;
    });

    return activeStream;
  } catch {
    return null;
  }
}

async function captureFromStream(
  stream: MediaStream,
  rect: DOMRect,
  format: string,
  quality: number,
): Promise<string> {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => { video.play().then(resolve).catch(reject); };
    video.onerror = reject;
  });

  if ('requestVideoFrameCallback' in video) {
    await new Promise<void>((r) => (video as any).requestVideoFrameCallback(() => r()));
  } else {
    await new Promise((r) => setTimeout(r, 200));
  }

  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  const videoW = settings.width || video.videoWidth;
  const videoH = settings.height || video.videoHeight;
  const scaleX = videoW / window.innerWidth;
  const scaleY = videoH / window.innerHeight;

  const sx = rect.left * scaleX;
  const sy = rect.top * scaleY;
  const sw = rect.width * scaleX;
  const sh = rect.height * scaleY;

  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  video.pause();
  video.srcObject = null;

  return canvas.toDataURL(format, quality);
}

export async function captureRect(
  rect: { x: number; y: number; width: number; height: number },
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92,
): Promise<string | null> {
  if (rect.width === 0 || rect.height === 0) return null;

  try {
    const domRect = new DOMRect(rect.x, rect.y, rect.width, rect.height);

    if (customProvider) {
      return await customProvider(domRect);
    }

    const stream = await getStream();
    if (stream) {
      return await captureFromStream(stream, domRect, format, quality);
    }

    console.warn('[rune-grab] No screenshot method available. Use setCaptureProvider() for Electron apps.');
    return null;
  } catch (err) {
    console.warn('[rune-grab] Screenshot capture failed:', err);
    return null;
  }
}

export function releaseStream(): void {
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }
}
