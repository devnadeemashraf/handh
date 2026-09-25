'use client';

import { ArrowRight, HelpCircle, MessageSquare, Search, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const FAQ_CATEGORIES = [
  'All',
  'Orders',
  'Payments',
  'Shipping',
  'Delivery',
  'Returns',
  'Exchanges',
  'Products',
  'Sizing',
  'Care'
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'ord-1',
    category: 'Orders',
    question: 'How do I track the progress of my order?',
    answer:
      'You can track your order at any moment on our dedicated /track page by entering your order reference number (e.g., HH-2026-XXXX) or via the tracking link sent to your registered email and SMS once dispatched.'
  },
  {
    id: 'ord-2',
    category: 'Orders',
    question: 'Can I cancel or modify an order after placing it?',
    answer:
      'Because our atelier begins inspecting and preparing your garment promptly, orders can only be modified or cancelled within 2 hours of placement. Please contact our concierge immediately via WhatsApp or phone.'
  },
  {
    id: 'pay-1',
    category: 'Payments',
    question: 'Which payment methods are accepted at checkout?',
    answer:
      'We accept all major Indian and international debit/credit cards (Visa, MasterCard, RuPay, Amex), UPI (Google Pay, PhonePe, Paytm), Net Banking across 50+ banks, and Cash on Delivery (COD) for eligible domestic pin codes.'
  },
  {
    id: 'pay-2',
    category: 'Payments',
    question: 'Is online payment secure on H&H?',
    answer:
      'Yes, 100%. All card and UPI transactions are processed through bank-grade 256-bit SSL encryption via Razorpay. We never store your full card number, CVV, or UPI PIN on our servers.'
  },
  {
    id: 'ship-1',
    category: 'Shipping',
    question: 'What are your domestic shipping timelines and charges?',
    answer:
      'We offer complimentary insured express shipping on all domestic orders across India. Orders are dispatched from our Hyderabad atelier within 24 to 48 business hours. Delivery typically takes 2-4 business days for metropolitan cities and 3-6 business days for regional pin codes.'
  },
  {
    id: 'ship-2',
    category: 'Shipping',
    question: 'Do you ship internationally?',
    answer:
      'Yes, we ship to select international destinations including the UAE, Saudi Arabia, UK, and USA via DHL Express. International shipping rates and duties are computed dynamically at checkout.'
  },
  {
    id: 'del-1',
    category: 'Delivery',
    question: 'What happens if I miss my courier delivery?',
    answer:
      'Our courier partners (Bluedart, Delhivery, DTDC) will attempt delivery up to three consecutive times and will contact you via phone before each attempt. You can also reschedule via the courier SMS tracking link.'
  },
  {
    id: 'ret-1',
    category: 'Returns',
    question: 'What is your return policy window?',
    answer:
      'We honor a 7-day hassle-free return policy from the date of confirmed delivery. Items must be in their original, unwashed, and unworn condition with all atelier tags intact in the original presentation box.'
  },
  {
    id: 'ret-2',
    category: 'Returns',
    question: 'How do I initiate a return?',
    answer:
      'Go to /account/orders, locate your order, and tap "Request Return". Our automated system will generate a prepaid return pickup with our courier partner within 48 hours.'
  },
  {
    id: 'exc-1',
    category: 'Exchanges',
    question: 'Can I exchange for a different size or shade?',
    answer:
      'Yes. If the size or shade is not ideal, you can request an exchange through your order history. Once your returned piece passes quality inspection, the replacement piece is dispatched with zero additional shipping fees.'
  },
  {
    id: 'prod-1',
    category: 'Products',
    question: 'Where are H&H garments designed and manufactured?',
    answer:
      'All garments are conceptualized and tailored in our Hyderabad atelier. We partner directly with heritage silk weavers in Karnataka and long-staple cotton farmers in Gujarat.'
  },
  {
    id: 'siz-1',
    category: 'Sizing',
    question: 'How do I choose the correct modest fit?',
    answer:
      'Our abayas and co-ords are cut with intentional ease and modesty draping. Please consult our detailed Size Guide on any product detail page, which provides exact garment chest, shoulder, and length measurements in both inches and centimeters.'
  },
  {
    id: 'car-1',
    category: 'Care',
    question: 'How should I wash and care for mulberry silk pieces?',
    answer:
      'We recommend dry cleaning or gentle hand-washing in cold water with pH-neutral silk detergent. Never wring or tumble-dry; air dry flat in shaded natural light, and steam iron on the reverse silk setting.'
  }
];

export function FaqClient() {
  const [selectedCategory, setSelectedCategory] = React.useState<FaqCategory>('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredFaqs = React.useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Category Chips Bar */}
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="FAQ Categories"
      >
        {FAQ_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'h-9 px-4 rounded-sm text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors select-none shrink-0 border',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card/70 text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground'
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search-Within-FAQ Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search questions by keyword (e.g. silk, returns, timeline, UPI)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search frequently asked questions"
          className="h-11 pl-10 pr-10 rounded-sm bg-background border-border text-xs sm:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear FAQ search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question Accordion or Empty Results State */}
      {filteredFaqs.length > 0 ? (
        <div className="rounded-sm border border-border bg-card/60 px-5 sm:px-6">
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="font-serif text-sm sm:text-base font-medium text-foreground py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-sm border border-border bg-card p-10 sm:p-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-muted-foreground">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            No Questions Match Your Search
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            We couldn&apos;t find an answer for &ldquo;{searchQuery}&rdquo;. Try another term or
            contact our concierge directly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="rounded-sm text-xs"
            >
              Clear Search &amp; Filters
            </Button>
            <Button asChild size="sm" className="rounded-sm text-xs">
              <Link href="/contact" className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact Concierge</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Concierge Escalation Banner */}
      <div className="rounded-sm border border-border/60 bg-secondary/15 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-serif text-sm sm:text-base font-semibold text-foreground mb-1">
            Still Have an Unanswered Question?
          </h4>
          <p className="text-xs text-muted-foreground">
            Our atelier specialists are available Monday to Friday from 10:00 AM to 6:00 PM IST.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-sm text-xs shrink-0">
          <Link href="/contact" className="inline-flex items-center gap-1.5">
            <span>Speak With Concierge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
