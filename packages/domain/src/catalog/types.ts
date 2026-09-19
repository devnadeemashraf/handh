import type { ProductCustomizationRule } from './customization';

export interface PublicVariantItem {
  id: string;
  sku: string;
  title: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  options?: { name: string; value: string }[];
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
  department?: string;
  isCustomizable?: boolean;
  startingPriceMinor: number;
  currency: string;
  primaryImageUrl: string | null;
  categoryName: string | null;
  tags?: string[];
  isAvailable: boolean;
}

export interface PublicProductDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  department?: string;
  currency: string;
  isCustomizable?: boolean;
  customizationConfig?: ProductCustomizationRule | null;
  specifications?: Record<string, string | number | boolean>;
  tags?: string[];
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
  path?: string;
  depth?: number;
  description: string | null;
  applicableFilterKeys?: string[];
  subcategories: CategoryTreeItem[];
}
