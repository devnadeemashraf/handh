import Link from 'next/link';

export function Footer({
  storeName,
  instagramHandle
}: {
  storeName: string;
  instagramHandle?: string | undefined;
}) {
  return (
    <footer className="mt-20 border-t border-border bg-card/80 pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-border">
          {/* Column 1: Brand */}
          <div>
            <span className="font-serif text-2xl font-semibold tracking-wide text-primary">
              {storeName}
            </span>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">
              Crafted with intention. Delivering signature modest wear accessories and refined
              essentials directly to your doorstep.
            </p>
          </div>

          {/* Column 2: Order Journey */}
          <div>
            <span className="block mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Order &amp; Fulfillment
            </span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Encrypted Razorpay Checkout</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Hand-Inspected &amp; Packed</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>India Post &amp; DTDC Couriers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Direct In-App Shipment Tracking</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Instagram & Socials */}
          <div>
            <span className="block mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Connect
            </span>
            {instagramHandle ? (
              <a
                href={`https://instagram.com/${instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors"
              >
                Follow @{instagramHandle} on Instagram &rarr;
              </a>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Discover our story, craftsmanship drops, and latest design previews on Instagram.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/track" className="hover:text-foreground transition-colors">
              Track Parcel
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
