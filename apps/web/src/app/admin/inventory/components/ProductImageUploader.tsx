'use client';

import { AlertCircle, Loader2, Star, Upload, X } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface UploadedImageItem {
  storageKey: string;
  url: string;
  altText: string;
  sortOrder: number;
}

interface ProductImageUploaderProps {
  images: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  maxImages?: number;
}

export function ProductImageUploader({
  images,
  onChange,
  maxImages = 6
}: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (images.length >= maxImages) {
      setUploadError(`Maximum of ${maxImages} images allowed per piece.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      const newImage: UploadedImageItem = {
        storageKey: data.file.storageKey,
        url: data.file.url,
        altText: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        sortOrder: images.length
      };

      onChange([...images, newImage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        await uploadFile(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        await uploadFile(file);
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, sortOrder: i }));
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const target = images[index];
    if (!target) return;
    const others = images.filter((_, i) => i !== index);
    const reordered = [target, ...others].map((img, i) => ({ ...img, sortOrder: i }));
    onChange(reordered);
  };

  const handleAltTextChange = (index: number, altText: string) => {
    const updated = images.map((img, i) => (i === index ? { ...img, altText } : img));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-accent/60 bg-muted/20 hover:bg-muted/40',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>
        <p className="text-sm font-medium text-foreground">
          {isUploading ? 'Uploading assets...' : 'Click to select or drag & drop piece photos'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports JPEG, PNG, WebP, SVG up to 10MB each ({images.length}/{maxImages} uploaded)
        </p>
      </div>

      {/* Error alert */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Thumbnail Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.storageKey || idx}
              className={cn(
                'group relative rounded-xl border overflow-hidden bg-card shadow-xs transition-all flex flex-col',
                idx === 0 ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border'
              )}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square w-full bg-muted/30 overflow-hidden flex items-center justify-center">
                <img
                  src={img.url}
                  alt={img.altText || 'Product image'}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Primary Tag */}
                {idx === 0 ? (
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold tracking-wider">
                    Primary Photo
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 left-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-xs shadow-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(idx);
                    }}
                    title="Set as Primary Cover"
                  >
                    <Star className="h-3.5 w-3.5 text-accent" />
                  </Button>
                )}

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  title="Remove Image"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Alt Text Input */}
              <div className="p-2 border-t border-border bg-background">
                <Input
                  type="text"
                  placeholder="Alt text / description..."
                  value={img.altText}
                  onChange={(e) => handleAltTextChange(idx, e.target.value)}
                  className="h-7 text-xs border-muted focus-visible:ring-1"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
