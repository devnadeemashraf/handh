import { Eye, X } from 'lucide-react';

interface DraftPreviewBannerProps {
  exitPath?: string;
}

export function DraftPreviewBanner({ exitPath = '/' }: DraftPreviewBannerProps) {
  return (
    <aside
      aria-label="Draft Preview Mode"
      className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/15 backdrop-blur-md px-4 py-2 text-xs text-amber-950 dark:text-amber-200"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold tracking-wide uppercase text-[11px]">
          Draft Preview Mode Active
        </span>
        <span className="hidden sm:inline text-muted-foreground">
          — Real-time unpublished/draft SDUI configurations are enabled.
        </span>
      </div>
      <a
        href={`/api/draft/disable?path=${encodeURIComponent(exitPath)}`}
        className="inline-flex items-center gap-1.5 rounded bg-amber-600/90 hover:bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors shadow-xs"
      >
        <X className="h-3.5 w-3.5" />
        Exit Preview
      </a>
    </aside>
  );
}
