import { z } from 'zod';

import { DEFAULT_BRAND_IDENTITY } from '../brand/config';
import { IndianPhoneSchema } from '../phone';

export const GRIEVANCE_CATEGORIES = [
  'shipping_delay',
  'damaged_defective',
  'wrong_item',
  'refund_payment',
  'product_quality',
  'cancellation',
  'other'
] as const;

export type GrievanceCategory = (typeof GRIEVANCE_CATEGORIES)[number];

export const GRIEVANCE_CATEGORY_LABELS: Record<GrievanceCategory, string> = {
  shipping_delay: 'Shipping & Delivery Delay',
  damaged_defective: 'Damaged or Defective Item Received',
  wrong_item: 'Incorrect Item / Size Received',
  refund_payment: 'Payment Deducted / Refund Delayed',
  product_quality: 'Product Quality or Authenticity Concern',
  cancellation: 'Order Cancellation Request',
  other: 'General Complaint / Other Inquiries'
};

export interface GrievanceOfficerInfo {
  name: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
  workingHours: string;
  acknowledgementSla: string;
  resolutionSla: string;
}

export interface CorporateCoordinates {
  legalName: string;
  tradeName: string;
  registeredAddress: string;
  cin: string;
  gstin: string;
  contactEmail: string;
  supportPhone: string;
}

export const DEFAULT_GRIEVANCE_OFFICER: GrievanceOfficerInfo = {
  name: DEFAULT_BRAND_IDENTITY.grievanceOfficer.name,
  designation: DEFAULT_BRAND_IDENTITY.grievanceOfficer.designation,
  email: DEFAULT_BRAND_IDENTITY.grievanceOfficer.email,
  phone: DEFAULT_BRAND_IDENTITY.grievanceOfficer.phone,
  address: DEFAULT_BRAND_IDENTITY.grievanceOfficer.address,
  workingHours: DEFAULT_BRAND_IDENTITY.grievanceOfficer.workingHours,
  acknowledgementSla: DEFAULT_BRAND_IDENTITY.grievanceOfficer.acknowledgementSla,
  resolutionSla: DEFAULT_BRAND_IDENTITY.grievanceOfficer.resolutionSla
};

export const DEFAULT_CORPORATE_COORDINATES: CorporateCoordinates = {
  legalName: DEFAULT_BRAND_IDENTITY.legalName,
  tradeName: DEFAULT_BRAND_IDENTITY.name,
  registeredAddress: DEFAULT_BRAND_IDENTITY.address.fullFormatted,
  cin: DEFAULT_BRAND_IDENTITY.cin,
  gstin: DEFAULT_BRAND_IDENTITY.gstin,
  contactEmail: DEFAULT_BRAND_IDENTITY.supportEmail,
  supportPhone: DEFAULT_BRAND_IDENTITY.supportPhone
};

export const GrievanceSubmissionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(128, 'Full name cannot exceed 128 characters'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  phoneNumber: IndianPhoneSchema,
  orderNumber: z
    .string()
    .trim()
    .max(64, 'Order number cannot exceed 64 characters')
    .optional()
    .or(z.literal('')),
  category: z.enum(GRIEVANCE_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid grievance category' })
  }),
  subject: z
    .string()
    .trim()
    .max(255, 'Subject cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .min(10, 'Please describe your grievance in at least 10 characters')
    .max(3000, 'Description cannot exceed 3,000 characters')
});

export type GrievanceSubmissionInput = z.infer<typeof GrievanceSubmissionSchema>;

export interface GrievanceTicketResult {
  success: boolean;
  ticketReference: string;
  status: 'received';
  acknowledgementDueAt: string;
  resolutionDueAt: string;
  createdAt: string;
  message: string;
}

/**
 * Generates an official statutory complaint reference number compliant with
 * Consumer Protection (E-Commerce) Rules, 2020 Rule 5(3)(c).
 * Format: GRV-YYYYMMDD-XXXXXX (e.g., GRV-20260923-8B3F9A)
 */
export function generateGrievanceTicketReference(date: Date = new Date()): string {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GRV-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Computes statutory SLA deadlines:
 * - 48 Hours for acknowledgement (Rule 4(5))
 * - 30 Days for final resolution (Rule 4(5))
 */
export function calculateGrievanceSlaDates(fromDate: Date = new Date()): {
  acknowledgementDueAt: Date;
  resolutionDueAt: Date;
} {
  const acknowledgementDueAt = new Date(fromDate.getTime() + 48 * 60 * 60 * 1000);
  const resolutionDueAt = new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { acknowledgementDueAt, resolutionDueAt };
}
