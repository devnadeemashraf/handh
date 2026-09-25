'use client';

import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

export interface ProductAccordionItem {
  id: string;
  title: string;
  content: string;
}

const DEFAULT_ITEMS: ProductAccordionItem[] = [
  {
    id: 'craftsmanship',
    title: 'Artisanal Craftsmanship',
    content:
      'Individually handcrafted and hand-finished with meticulous attention to line, balance, and contour. Designed to sit comfortably and securely on top of an Abaya or statement modesty wear without snagging fabric.'
  },
  {
    id: 'shipping',
    title: 'Courier Shipping & Tracking',
    content: `Every parcel is personally inspected, packaged, and handed directly to India Post or DTDC couriers. Once dispatched, you will receive a direct tracking link accessible through your ${DEFAULT_BRAND_IDENTITY.name} account and email notifications.`
  },
  {
    id: 'care',
    title: 'Care Instructions',
    content:
      'Keep away from direct moisture, perfumes, and harsh chemicals. Gently polish with a dry microfiber cloth after wear and store in the provided protective pouch.'
  }
];

export function ProductAccordion({ items = DEFAULT_ITEMS }: { items?: ProductAccordionItem[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="craftsmanship"
      className="mt-8 border-t border-border"
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="text-sm font-semibold text-primary hover:no-underline hover:text-accent py-4">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
