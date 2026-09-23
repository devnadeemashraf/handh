'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import React, { useState } from 'react';

import {
  extractIndianPhoneDigits,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_CATEGORY_LABELS,
  type GrievanceCategory,
  GrievanceSubmissionSchema,
  type GrievanceTicketResult
} from '@hh/domain';

export function GrievanceForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [category, setCategory] = useState<GrievanceCategory>('shipping_delay');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<GrievanceTicketResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digits = extractIndianPhoneDigits(val);
    setRawPhone(digits);
    if (errors['phoneNumber']) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next['phoneNumber'];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    const payload = {
      fullName,
      email,
      phoneNumber: rawPhone,
      orderNumber: orderNumber.trim() ? orderNumber.trim() : undefined,
      category,
      subject: subject.trim() ? subject.trim() : undefined,
      description
    };

    const parsed = GrievanceSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path && typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.details)) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              fieldErrors[key] = String(msgs[0]);
            }
          }
          setErrors(fieldErrors);
        }
        setSubmitError(data.message || 'Failed to submit grievance. Please try again.');
        return;
      }

      setTicketResult(data);
    } catch {
      setSubmitError('Network error. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (!ticketResult) return;
    navigator.clipboard.writeText(ticketResult.ticketReference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setRawPhone('');
    setOrderNumber('');
    setCategory('shipping_delay');
    setSubject('');
    setDescription('');
    setErrors({});
    setSubmitError(null);
    setTicketResult(null);
  };

  if (ticketResult) {
    const ackDate = new Date(ticketResult.acknowledgementDueAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const resDate = new Date(ticketResult.resolutionDueAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium'
    });

    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 sm:p-10 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4 text-emerald-400">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Statutory Complaint Formally Registered
            </span>
            <h3 className="text-xl font-serif font-medium text-foreground mt-1">
              Grievance Lodged Successfully
            </h3>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{ticketResult.message}</p>

        {/* Complaint Reference Card */}
        <div className="mt-6 rounded-xl border border-border bg-card/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Statutory Ticket Reference
              </span>
              <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-accent mt-0.5">
                {ticketResult.ticketReference}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyReference}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-secondary/60 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Reference'}</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-4 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">48-Hour Acknowledgment SLA</span>
                <p className="text-muted-foreground mt-0.5">Due by {ackDate} IST</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">30-Day Resolution Timeline</span>
                <p className="text-muted-foreground mt-0.5">Target resolution by {resDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span>Register Another Inquiry</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-border bg-card/70 p-6 sm:p-10 shadow-lg backdrop-blur-sm"
    >
      <div className="mb-6">
        <h3 className="text-lg font-serif font-semibold text-foreground">
          Register a Statutory Grievance
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Complaints submitted here are assigned directly to our designated Grievance Officer in
          compliance with Consumer Protection (E-Commerce) Rules, 2020.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Full Name */}
        <div>
          <label
            htmlFor="grievance-fullName"
            className="block text-xs font-medium text-foreground mb-1.5"
          >
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id="grievance-fullName"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors['fullName']) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next['fullName'];
                  return next;
                });
              }
            }}
            placeholder="e.g. Ayesha Siddiqua"
            disabled={isSubmitting}
            className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent ${
              errors['fullName'] ? 'border-destructive ring-1 ring-destructive' : 'border-border'
            }`}
          />
          {errors['fullName'] && (
            <p className="mt-1 text-xs text-destructive">{errors['fullName']}</p>
          )}
        </div>

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="grievance-email"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Email Address <span className="text-destructive">*</span>
            </label>
            <input
              id="grievance-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors['email']) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next['email'];
                    return next;
                  });
                }
              }}
              placeholder="e.g. ayesha@example.com"
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent ${
                errors['email'] ? 'border-destructive ring-1 ring-destructive' : 'border-border'
              }`}
            />
            {errors['email'] && <p className="mt-1 text-xs text-destructive">{errors['email']}</p>}
          </div>

          <div>
            <label
              htmlFor="grievance-phone"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Mobile Number (India) <span className="text-destructive">*</span>
            </label>
            <div className="relative flex rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-accent">
              <span className="inline-flex items-center px-3.5 border-r border-border text-xs font-medium text-muted-foreground bg-secondary/30 rounded-l-xl">
                +91
              </span>
              <input
                id="grievance-phone"
                type="tel"
                value={rawPhone}
                onChange={handlePhoneChange}
                maxLength={14}
                placeholder="98765 43210"
                disabled={isSubmitting}
                className={`w-full rounded-r-xl bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none ${
                  errors['phoneNumber'] ? 'border-destructive ring-1 ring-destructive' : ''
                }`}
              />
            </div>
            {errors['phoneNumber'] && (
              <p className="mt-1 text-xs text-destructive">{errors['phoneNumber']}</p>
            )}
          </div>
        </div>

        {/* Order Number & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="grievance-orderNumber"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Order Number <span className="text-muted-foreground">(Optional)</span>
            </label>
            <input
              id="grievance-orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. HH-2026-1042"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="grievance-category"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Grievance Category <span className="text-destructive">*</span>
            </label>
            <select
              id="grievance-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {GRIEVANCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {GRIEVANCE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="grievance-subject"
            className="block text-xs font-medium text-foreground mb-1.5"
          >
            Subject Summary <span className="text-muted-foreground">(Optional)</span>
          </label>
          <input
            id="grievance-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Delay in dispatch past estimated delivery date"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Detailed Description */}
        <div>
          <label
            htmlFor="grievance-description"
            className="block text-xs font-medium text-foreground mb-1.5"
          >
            Detailed Statement of Grievance <span className="text-destructive">*</span>
          </label>
          <textarea
            id="grievance-description"
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors['description']) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next['description'];
                  return next;
                });
              }
            }}
            placeholder="Please describe the exact issue, product details, dates, and previous support correspondence..."
            disabled={isSubmitting}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed ${
              errors['description'] ? 'border-destructive ring-1 ring-destructive' : 'border-border'
            }`}
          />
          {errors['description'] && (
            <p className="mt-1 text-xs text-destructive">{errors['description']}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 10 characters. Please do not submit cardholder PINs or CVVs.
          </p>
        </div>

        {/* Submission CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Registering Complaint...</span>
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4" />
                <span>Submit Grievance for Redressal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
