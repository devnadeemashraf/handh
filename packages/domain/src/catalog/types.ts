export interface PublicVariantItem {
  id: string;
  sku: string;
  title: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  isAvailable: boolean;
  availableQuantity: number;
}

export interface PublicProductImage {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface PublicProductListItem {
  id: string;
  slug: string;
  title: string;
  startingPriceMinor: number;
  currency: string;
  primaryImageUrl: string | null;
  categoryName: string | null;
  isAvailable: boolean;
}

export interface PublicProductDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  currency: string;
  category: {
    id: string;
    slug: string;
    name: string;
  } | null;
  variants: PublicVariantItem[];
  images: PublicProductImage[];
  seo: {
    title: string | null;
    description: string | null;
  };
}

export interface CategoryTreeItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subcategories: CategoryTreeItem[];
}
