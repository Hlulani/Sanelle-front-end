import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';

/** Downloads in the browser, opens the native save/share sheet on phones. */
export async function saveFile(name: string, content: string, mime: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const bytes = new TextEncoder().encode(content);
    let binary = ''; bytes.forEach((byte) => binary += String.fromCharCode(byte));
    const path = `sanelle-${Date.now()}-${name}`;
    await Filesystem.writeFile({ path, directory: Directory.Cache, data: btoa(binary) });
    try {
      const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
      await Share.share({ title: name, files: [uri] });
    } finally { await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined); }
  } else {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
