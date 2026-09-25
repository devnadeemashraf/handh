import { DEFAULT_BRAND_IDENTITY } from '../brand/config';

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

export interface ManufacturerDetails {
  name: string;
  address: string;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface LegalMetrologyDeclarations {
  countryOfOrigin: string;
  netQuantity: string;
  commodityName: string;
  manufacturer: ManufacturerDetails;
  packer?: ManufacturerDetails | undefined;
  consumerCare: {
    email: string;
    phone: string;
    address: string;
  };
}

export const DEFAULT_LEGAL_METROLOGY: LegalMetrologyDeclarations = {
  countryOfOrigin: 'India',
  netQuantity: '1 N',
  commodityName: 'Handcrafted Modest Wear Accessory',
  manufacturer: {
    name: DEFAULT_BRAND_IDENTITY.legalName,
    address: DEFAULT_BRAND_IDENTITY.address.fullFormatted,
    email: DEFAULT_BRAND_IDENTITY.supportEmail,
    phone: DEFAULT_BRAND_IDENTITY.supportPhone
  },
  packer: {
    name: DEFAULT_BRAND_IDENTITY.legalName,
    address: DEFAULT_BRAND_IDENTITY.address.fullFormatted
  },
  consumerCare: {
    email: DEFAULT_BRAND_IDENTITY.supportEmail,
    phone: DEFAULT_BRAND_IDENTITY.supportPhone,
    address: DEFAULT_BRAND_IDENTITY.address.fullFormatted
  }
};

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
  countryOfOrigin: string;
  netQuantity: string;
  commodityName?: string | undefined;
  manufacturerDetails: ManufacturerDetails;
  packerDetails?: ManufacturerDetails | undefined;
  consumerCareDetails?:
    | {
        email: string;
        phone: string;
        address: string;
      }
    | undefined;
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
