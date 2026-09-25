import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { DEFAULT_BRAND_IDENTITY, Money } from '@hh/domain';

import type { PublicProductListItem } from '@hh/domain';

import { WishlistButton } from '../product/WishlistButton';

export function ProductCard({
  product,
  priority = false
}: {
  product: PublicProductListItem;
  priority?: boolean;
}) {
  const formattedPrice = Money.fromMinor(product.startingPriceMinor, 'INR').format('en-IN');

  return (
    <Card className="group relative flex flex-col overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-md">
      {/* Wishlist Button floating top-right */}
      <div className="absolute top-3 right-3 z-10">
        <WishlistButton productId={product.id} size={18} />
      </div>

      <Link href={`/products/${product.slug}`} className="block relative">
        {/* 3:4 Luxury Aspect Ratio Image Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/40">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-serif tracking-widest uppercase text-muted-foreground">
              {DEFAULT_BRAND_IDENTITY.shortName} Signature
            </div>
          )}

          {/* Stock Badge */}
          <div className="absolute top-3 left-3">
            {product.isAvailable ? (
              <Badge
                variant="gold"
                className="text-[0.65rem] font-semibold tracking-wider uppercase"
              >
                In Stock
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-foreground/80 text-background text-[0.65rem] font-semibold tracking-wider uppercase"
              >
                Sold Out
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {product.categoryName && (
            <span className="mb-1 block text-[0.65rem] uppercase tracking-[0.18em] font-semibold text-accent">
              {product.categoryName}
            </span>
          )}

          <h3 className="line-clamp-2 font-medium text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
            <Link href={`/products/${product.slug}`}>{product.title}</Link>
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex flex-col">
            <span className="text-base font-semibold text-primary">{formattedPrice}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              MRP (incl. taxes)
            </span>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="text-xs uppercase tracking-wider font-semibold text-accent hover:text-primary transition-colors"
          >
            View Details &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
