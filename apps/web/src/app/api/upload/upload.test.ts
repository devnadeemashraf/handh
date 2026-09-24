import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';
import * as storageModule from '@/lib/storage';

import { POST } from './route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn()
}));

vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage')>();
  return {
    ...actual,
    getStorageProvider: vi.fn()
  };
});

function createMockFile(
  bytes: Uint8Array,
  name: string,
  type: string,
  sizeOverride?: number
): File {
  const file = new File([bytes as unknown as BlobPart], name, { type });
  if (sizeOverride !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeOverride });
  }
  file.arrayBuffer = () =>
    Promise.resolve(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    );
  return file;
}

function createUploadRequest(formData: FormData): Request {
  return {
    formData: () => Promise.resolve(formData),
    headers: new Headers()
  } as unknown as Request;
}

describe('File Upload API Route (POST /api/upload)', () => {
  const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const mockUploadResult = {
    url: '/uploads/products/test-file.png',
    filename: 'test-file.png',
    storageKey: 'products/test-file.png',
    sizeBytes: 8,
    mimeType: 'image/png'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects request when no file is provided in FormData with 400', async () => {
    const formData = new FormData();
    formData.append('folder', 'general');

    const request = createUploadRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('No file provided');
  });

  it('rejects uploads to products folder without an authenticated admin session with 401', async () => {
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

    const formData = new FormData();
    const file = createMockFile(validPngBytes, 'sample.png', 'image/png');
    formData.append('file', file);
    formData.append('folder', 'products');

    const request = createUploadRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  it('rejects files exceeding maximum allowed size of 10MB with 413', async () => {
    const formData = new FormData();
    const largeFile = createMockFile(
      new Uint8Array([1, 2, 3]),
      'huge.png',
      'image/png',
      11 * 1024 * 1024
    );

    formData.append('file', largeFile);
    formData.append('folder', 'general');

    const request = createUploadRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(413);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('exceeds maximum allowed size');
  });

  it('rejects unsupported MIME types with 415', async () => {
    const formData = new FormData();
    const exeFile = createMockFile(
      new Uint8Array([1, 2, 3, 4]),
      'script.exe',
      'application/x-msdownload'
    );
    formData.append('file', exeFile);
    formData.append('folder', 'general');

    const request = createUploadRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(415);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unsupported file type');
  });

  it('rejects files with spoofed MIME headers failing magic bytes validation with 400', async () => {
    const formData = new FormData();
    // Declared as image/png but payload contains non-PNG bytes
    const fakeBytes = new TextEncoder().encode('definitely-not-a-png-file');
    const spoofedFile = createMockFile(fakeBytes, 'fake.png', 'image/png');
    formData.append('file', spoofedFile);
    formData.append('folder', 'general');

    const request = createUploadRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('File header does not match');
  });

  it('successfully uploads valid file with verified magic bytes', async () => {
    const mockStorage = {
      upload: vi.fn().mockResolvedValue(mockUploadResult),
      delete: vi.fn(),
      getPublicUrl: vi.fn(),
      getUrl: vi.fn().mockReturnValue('/uploads/products/test-file.png')
    };
    vi.mocked(storageModule.getStorageProvider).mockReturnValue(mockStorage);

    const formData = new FormData();
    const file = createMockFile(validPngBytes, 'real.png', 'image/png');
    formData.append('file', file);
    formData.append('folder', 'general');

    const request = createUploadRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.file.url).toBe('/uploads/products/test-file.png');
    expect(mockStorage.upload).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        filename: 'real.png',
        mimeType: 'image/png',
        folder: 'general'
      })
    );
  });
});
