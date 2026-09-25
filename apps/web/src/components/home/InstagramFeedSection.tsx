import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  permalink: string;
}

const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'post-1',
    imageUrl:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    caption: 'Draped in autumn hues. The Mulberry Silk Collection.',
    permalink: 'https://instagram.com/handh_official'
  },
  {
    id: 'post-2',
    imageUrl:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    caption: 'Behind the atelier seams: hand-rolled French hems.',
    permalink: 'https://instagram.com/handh_official'
  },
  {
    id: 'post-3',
    imageUrl:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    caption: 'Architectural lines meeting modesty. The Noir Abaya.',
    permalink: 'https://instagram.com/handh_official'
  },
  {
    id: 'post-4',
    imageUrl:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    caption: 'Soft-washed Egyptian cotton co-ords for everyday calm.',
    permalink: 'https://instagram.com/handh_official'
  }
];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function InstagramFeedSection({
  handle = 'handh_official',
  className
}: {
  handle?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <section
      aria-label="Instagram Feed and Visual Gallery"
      className={cn('py-12 sm:py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent mb-1.5">
            Follow The Atelier
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            On The Feed
          </h2>
        </div>
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm font-medium text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1.5"
        >
          <InstagramIcon className="w-4 h-4" />
          <span>@{handle}</span>
          <span>&rarr;</span>
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {INSTAGRAM_POSTS.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View Instagram post: ${post.caption}`}
            className="group relative block aspect-square overflow-hidden rounded-sm bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Image
              src={post.imageUrl}
              alt={post.caption}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Hover overlay with Instagram icon and caption */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between text-white">
              <div className="flex justify-end">
                <InstagramIcon className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs text-zinc-200 line-clamp-3 leading-relaxed">{post.caption}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
