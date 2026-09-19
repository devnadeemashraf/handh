import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import type { StorageProvider, StorageUploadResult, UploadOptions } from './types';

/**
 * Validates file buffer against known magic bytes to avoid MIME spoofing.
 */
export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (declaredMimeType === 'image/jpeg' || declaredMimeType === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (declaredMimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (declaredMimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // PDF: 25 50 44 46 (%PDF)
  if (declaredMimeType === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // SVG: Check start text contains <svg
  if (declaredMimeType === 'image/svg+xml') {
    const text = buffer.subarray(0, 1024).toString('utf-8').trim().toLowerCase();
    return text.startsWith('<svg') || (text.startsWith('<?xml') && text.includes('<svg'));
  }

  return false;
}

export class LocalStorageAdapter implements StorageProvider {
  private baseUploadDir: string;
  private publicPrefix: string;

  constructor() {
    // Resolve upload directory flexibly whether running in apps/web or workspace root
    const cwd = process.cwd();
    if (cwd.endsWith('apps/web')) {
      this.baseUploadDir = path.join(cwd, 'public', 'uploads');
    } else {
      this.baseUploadDir = path.join(cwd, 'apps', 'web', 'public', 'uploads');
    }
    this.publicPrefix = '/uploads';
  }

  async upload(fileBuffer: Buffer, options: UploadOptions): Promise<StorageUploadResult> {
    const folder = options.folder ?? 'general';
    const targetDir = path.join(this.baseUploadDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    // Sanitize extension and filename
    const ext = path.extname(options.filename).toLowerCase() || '.bin';
    const cleanBasename = path
      .basename(options.filename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const finalFilename = `${cleanBasename}-${uniqueId}${ext}`;
    const storageKey = `${folder}/${finalFilename}`;
    const filePath = path.join(targetDir, finalFilename);

    await fs.writeFile(filePath, fileBuffer);

    return {
      url: `${this.publicPrefix}/${storageKey}`,
      storageKey,
      filename: finalFilename,
      size: fileBuffer.length,
      mimeType: options.mimeType
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const sanitizedKey = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, '');
      const filePath = path.join(this.baseUploadDir, sanitizedKey);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(storageKey: string): string {
    const sanitizedKey = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, '');
    return `${this.publicPrefix}/${sanitizedKey}`;
  }
}
