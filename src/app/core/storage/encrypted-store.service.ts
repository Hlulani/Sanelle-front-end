import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

/**
 * Encrypts sensitive records (health records, allergies) before they're saved.
 *
 * - Data: AES-256-GCM with a fresh random IV per save, stored in Preferences as
 *   "enc:v1:<iv>.<ciphertext>" (base64).
 * - Key, on iOS/Android: 256 random bits kept in the Keychain / Keystore via
 *   SecureStorage (not synced to iCloud).
 * - Key, in a browser: a non-extractable CryptoKey kept in IndexedDB, so page
 *   scripts can use it but can't read it out.
 *
 * Values saved before encryption existed are read once as plain text and
 * re-saved encrypted.
 */
const PREFIX = 'enc:v1:';
const KEY_NAME = 'sanelle.records.key.v1';
const IDB_NAME = 'sanelle-keys';
const IDB_STORE = 'keys';

function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

@Injectable({ providedIn: 'root' })
export class EncryptedStore {
  private keyPromise: Promise<CryptoKey> | null = null;

  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    if (value == null) return null;
    if (!value.startsWith(PREFIX)) {
      // Saved before encryption: return it and replace it with an encrypted copy.
      await this.set(key, value);
      return value;
    }
    try {
      const [ivB64, ctB64] = value.slice(PREFIX.length).split('.');
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromB64(ivB64) as BufferSource },
        await this.key(),
        fromB64(ctB64) as BufferSource,
      );
      return new TextDecoder().decode(plain);
    } catch {
      // Wrong key or tampered data: treat as unreadable rather than crash.
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      await this.key(),
      new TextEncoder().encode(value) as BufferSource,
    );
    await Preferences.set({ key, value: `${PREFIX}${toB64(iv)}.${toB64(ct)}` });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  private key(): Promise<CryptoKey> {
    if (!this.keyPromise) {
      this.keyPromise = (Capacitor.isNativePlatform() ? this.nativeKey() : this.browserKey()).catch((e) => {
        this.keyPromise = null;
        throw e;
      });
    }
    return this.keyPromise;
  }

  private async nativeKey(): Promise<CryptoKey> {
    await SecureStorage.setSynchronize(false);
    let raw = (await SecureStorage.get(KEY_NAME)) as string | null;
    if (!raw) {
      raw = toB64(crypto.getRandomValues(new Uint8Array(32)));
      await SecureStorage.set(KEY_NAME, raw);
    }
    return crypto.subtle.importKey('raw', fromB64(raw) as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }

  private async browserKey(): Promise<CryptoKey> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(KEY_NAME);
      req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
      req.onerror = () => reject(req.error);
    });
    if (existing) return existing;
    const created = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(created, KEY_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return created;
  }
}
