export interface StorageUploadResult {
  url: string;
  storageKey: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  filename: string;
  mimeType: string;
  folder?: 'products' | 'custom-artwork' | 'general';
}

export interface StorageProvider {
  upload(fileBuffer: Buffer, options: UploadOptions): Promise<StorageUploadResult>;
  delete(storageKey: string): Promise<boolean>;
  getUrl(storageKey: string): string;
}
