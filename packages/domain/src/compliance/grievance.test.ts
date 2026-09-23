import { describe, expect, it } from 'vitest';

import {
  calculateGrievanceSlaDates,
  DEFAULT_CORPORATE_COORDINATES,
  DEFAULT_GRIEVANCE_OFFICER,
  generateGrievanceTicketReference,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_CATEGORY_LABELS,
  GrievanceSubmissionSchema
} from './types';

describe('Grievance Redressal Domain', () => {
  describe('Statutory Defaults', () => {
    it('provides complete statutory Grievance Officer coordinates', () => {
      expect(DEFAULT_GRIEVANCE_OFFICER.name).toBe('Mohammed Irfan');
      expect(DEFAULT_GRIEVANCE_OFFICER.designation).toContain('Grievance Officer');
      expect(DEFAULT_GRIEVANCE_OFFICER.email).toBe('grievance@handh.in');
      expect(DEFAULT_GRIEVANCE_OFFICER.phone).toBeDefined();
      expect(DEFAULT_GRIEVANCE_OFFICER.acknowledgementSla).toContain('48 hours');
      expect(DEFAULT_GRIEVANCE_OFFICER.resolutionSla).toContain('30 calendar days');
    });

    it('provides registered corporate coordinates including CIN and GSTIN', () => {
      expect(DEFAULT_CORPORATE_COORDINATES.legalName).toContain('Private Limited');
      expect(DEFAULT_CORPORATE_COORDINATES.cin).toMatch(/^U\d{5}[A-Z]{2}\d{4}PTC\d{6}$/);
      expect(DEFAULT_CORPORATE_COORDINATES.gstin).toMatch(
        /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/
      );
      expect(DEFAULT_CORPORATE_COORDINATES.contactEmail).toBe('support@handh.in');
    });

    it('maps all categories to readable human labels', () => {
      for (const cat of GRIEVANCE_CATEGORIES) {
        expect(GRIEVANCE_CATEGORY_LABELS[cat]).toBeDefined();
        expect(typeof GRIEVANCE_CATEGORY_LABELS[cat]).toBe('string');
      }
    });
  });

  describe('generateGrievanceTicketReference', () => {
    it('generates a compliant statutory reference format GRV-YYYYMMDD-XXXXXX', () => {
      const fixedDate = new Date('2026-09-23T10:00:00Z');
      const ref = generateGrievanceTicketReference(fixedDate);
      expect(ref).toMatch(/^GRV-20260923-[A-Z0-9]{6}$/);
    });

    it('generates distinct references on successive calls', () => {
      const ref1 = generateGrievanceTicketReference();
      const ref2 = generateGrievanceTicketReference();
      expect(ref1).not.toBe(ref2);
    });
  });

  describe('calculateGrievanceSlaDates', () => {
    it('computes exact 48-hour acknowledgement and 30-day resolution deadlines', () => {
      const base = new Date('2026-09-23T12:00:00.000Z');
      const { acknowledgementDueAt, resolutionDueAt } = calculateGrievanceSlaDates(base);

      const diffAckHours = (acknowledgementDueAt.getTime() - base.getTime()) / (1000 * 60 * 60);
      const diffResDays = (resolutionDueAt.getTime() - base.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffAckHours).toBe(48);
      expect(diffResDays).toBe(30);
    });
  });

  describe('GrievanceSubmissionSchema', () => {
    const validPayload = {
      fullName: 'Ayesha Siddiqua',
      email: 'ayesha.siddiqua@example.com',
      phoneNumber: '9876543210',
      orderNumber: 'HH-2026-0042',
      category: 'shipping_delay' as const,
      subject: 'Delay in shipment dispatch',
      description: 'My order has not moved from the origin hub for over 4 business days.'
    };

    it('validates and normalizes valid grievance submission with 10-digit phone', () => {
      const parsed = GrievanceSubmissionSchema.parse(validPayload);
      expect(parsed.fullName).toBe('Ayesha Siddiqua');
      expect(parsed.email).toBe('ayesha.siddiqua@example.com');
      expect(parsed.phoneNumber).toBe('+919876543210');
      expect(parsed.category).toBe('shipping_delay');
    });

    it('accepts +91 phone number and normalizes to canonical E.164', () => {
      const parsed = GrievanceSubmissionSchema.parse({
        ...validPayload,
        phoneNumber: '+919876543210'
      });
      expect(parsed.phoneNumber).toBe('+919876543210');
    });

    it('rejects invalid email address', () => {
      expect(() =>
        GrievanceSubmissionSchema.parse({
          ...validPayload,
          email: 'not-an-email'
        })
      ).toThrow();
    });

    it('rejects invalid phone number', () => {
      expect(() =>
        GrievanceSubmissionSchema.parse({
          ...validPayload,
          phoneNumber: '12345'
        })
      ).toThrow();
    });

    it('rejects short description under 10 chars', () => {
      expect(() =>
        GrievanceSubmissionSchema.parse({
          ...validPayload,
          description: 'Too short'
        })
      ).toThrow();
    });

    it('rejects invalid category', () => {
      expect(() =>
        GrievanceSubmissionSchema.parse({
          ...validPayload,
          category: 'invalid_category'
        })
      ).toThrow();
    });

    it('allows empty or omitted orderNumber and subject', () => {
      const parsed = GrievanceSubmissionSchema.parse({
        fullName: 'Fatima Khan',
        email: 'fatima@example.com',
        phoneNumber: '9876543210',
        category: 'other',
        description: 'General inquiry about material sourcing and certificates.'
      });
      expect(parsed.orderNumber).toBeUndefined();
      expect(parsed.subject).toBeUndefined();
    });
  });
});
