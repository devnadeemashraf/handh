import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getStorageProvider, validateMagicBytes } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf'
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in form data.' },
        { status: 400 }
      );
    }

    // Only admins can upload directly to products directory
    if (folder === 'products') {
      const isAuthed = await getAdminSession();
      if (!isAuthed) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Admin session required for product assets.' },
          { status: 401 }
        );
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File exceeds maximum allowed size of 10MB.' },
        { status: 413 }
      );
    }

    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type (${mimeType}). Supported formats: JPEG, PNG, WebP, SVG, PDF.`
        },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes to avoid MIME spoofing
    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { success: false, error: 'File header does not match declared MIME type.' },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    const result = await storage.upload(buffer, {
      filename: file.name,
      mimeType,
      folder: folder === 'products' || folder === 'custom-artwork' ? folder : 'general'
    });

    return NextResponse.json({
      success: true,
      file: result
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal upload error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
