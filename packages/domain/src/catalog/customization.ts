export interface CustomTextConfig {
  maxLength: number;
  allowedFonts?: string[];
  allowedPositions?: string[];
  pricePerCharMinor?: number;
}

export interface CustomImageConfig {
  allowedMimeTypes: ('image/jpeg' | 'image/png' | 'image/svg+xml' | 'application/pdf')[];
  maxFileSizeMb: number;
  minResolutionWidthPx?: number;
  minResolutionHeightPx?: number;
  mockupOverlayUrl?: string;
}

export interface ProductCustomizationRule {
  enabled: boolean;
  surchargeMinor: number;
  productionLeadDays: number;
  allowCustomText: boolean;
  textConfig?: CustomTextConfig;
  allowImageUpload: boolean;
  imageConfig?: CustomImageConfig;
  allowedPlacements?: string[];
  customDisclaimer?: string;
}

export interface OrderItemCustomizationRecord {
  isCustomized: boolean;
  surchargeMinor: number;
  customText?: string;
  fontChoice?: string;
  placement?: string;
  uploadedArtworkUrl?: string;
  uploadedArtworkStorageKey?: string;
  customerNotes?: string;
  productionStatus?: 'pending_print' | 'in_production' | 'quality_approved';
}

/**
 * Validates customer customization input against the product's customization rules.
 */
export function validateCustomizationPayload(
  rule: ProductCustomizationRule,
  input: {
    customText?: string;
    placement?: string;
    uploadedArtworkUrl?: string;
  }
): { valid: boolean; error?: string } {
  if (!rule.enabled) {
    return { valid: false, error: 'Customization is not enabled for this product.' };
  }

  // 1. Text length validation
  if (input.customText && rule.textConfig) {
    if (input.customText.length > rule.textConfig.maxLength) {
      return {
        valid: false,
        error: `Custom text exceeds maximum length of ${rule.textConfig.maxLength} characters.`
      };
    }
  }

  // 2. Placement validation
  if (input.placement && rule.allowedPlacements && rule.allowedPlacements.length > 0) {
    if (!rule.allowedPlacements.includes(input.placement)) {
      return {
        valid: false,
        error: `Selected placement "${input.placement}" is not allowed for this piece.`
      };
    }
  }

  // 3. Image requirement
  if (rule.allowImageUpload && !rule.allowCustomText && !input.uploadedArtworkUrl) {
    return {
      valid: false,
      error: 'Custom artwork image is required for this special order.'
    };
  }

  return { valid: true };
}
