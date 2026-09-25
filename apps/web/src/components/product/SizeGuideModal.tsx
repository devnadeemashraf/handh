'use client';

import * as React from 'react';
import {
  ModalSheet,
  ModalSheetContent,
  ModalSheetDescription,
  ModalSheetHeader,
  ModalSheetTitle
} from '@/components/ui/modal-sheet';
import { cn } from '@/lib/utils';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MeasurementRow {
  size: string;
  bustCm: number;
  waistCm: number;
  hipCm: number;
  lengthCm: number;
  bustIn: number;
  waistIn: number;
  hipIn: number;
  lengthIn: number;
}

const MEASUREMENTS: MeasurementRow[] = [
  {
    size: 'XS',
    bustCm: 84,
    waistCm: 66,
    hipCm: 91,
    lengthCm: 137,
    bustIn: 33,
    waistIn: 26,
    hipIn: 36,
    lengthIn: 54
  },
  {
    size: 'S',
    bustCm: 89,
    waistCm: 71,
    hipCm: 96,
    lengthCm: 140,
    bustIn: 35,
    waistIn: 28,
    hipIn: 38,
    lengthIn: 55
  },
  {
    size: 'M',
    bustCm: 94,
    waistCm: 76,
    hipCm: 102,
    lengthCm: 142,
    bustIn: 37,
    waistIn: 30,
    hipIn: 40,
    lengthIn: 56
  },
  {
    size: 'L',
    bustCm: 102,
    waistCm: 84,
    hipCm: 109,
    lengthCm: 145,
    bustIn: 40,
    waistIn: 33,
    hipIn: 43,
    lengthIn: 57
  },
  {
    size: 'XL',
    bustCm: 110,
    waistCm: 92,
    hipCm: 117,
    lengthCm: 147,
    bustIn: 43,
    waistIn: 36,
    hipIn: 46,
    lengthIn: 58
  }
];

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [unit, setUnit] = React.useState<'cm' | 'in'>('cm');

  return (
    <ModalSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalSheetContent className="max-w-lg">
        <ModalSheetHeader>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
            Measurement & Fit Guide
          </span>
          <ModalSheetTitle className="text-xl font-serif">Size Guide</ModalSheetTitle>
          <ModalSheetDescription className="text-xs text-muted-foreground">
            Body measurements for our standard modest silhouette. If you are between sizes, we
            recommend sizing up for comfortable draping.
          </ModalSheetDescription>
        </ModalSheetHeader>

        {/* Unit Toggle */}
        <div className="flex justify-end pt-2 pb-1">
          <div className="inline-flex rounded-sm border border-border p-0.5 bg-muted">
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-sm transition-all select-none',
                unit === 'cm'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Metric (cm)
            </button>
            <button
              type="button"
              onClick={() => setUnit('in')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-sm transition-all select-none',
                unit === 'in'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Imperial (in)
            </button>
          </div>
        </div>

        {/* Measurements Table */}
        <div className="overflow-x-auto border border-border rounded-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Bust</th>
                <th className="py-2.5 px-3">Waist</th>
                <th className="py-2.5 px-3">Hips</th>
                <th className="py-2.5 px-3">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MEASUREMENTS.map((row) => (
                <tr key={row.size} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-foreground">{row.size}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-muted-foreground">
                    {unit === 'cm' ? `${row.bustCm} cm` : `${row.bustIn}″`}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-muted-foreground">
                    {unit === 'cm' ? `${row.waistCm} cm` : `${row.waistIn}″`}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-muted-foreground">
                    {unit === 'cm' ? `${row.hipCm} cm` : `${row.hipIn}″`}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-muted-foreground">
                    {unit === 'cm' ? `${row.lengthCm} cm` : `${row.lengthIn}″`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to Measure Instructions */}
        <div className="mt-4 rounded-sm border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
          <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
            How to Measure
          </h4>
          <ul className="space-y-1.5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Bust:</strong> Measure around the fullest part of
              your chest, keeping tape horizontal.
            </li>
            <li>
              <strong className="text-foreground">Waist:</strong> Measure around your natural
              waistline, keeping tape comfortably loose.
            </li>
            <li>
              <strong className="text-foreground">Hips:</strong> Measure around the fullest part of
              your hips, approximately 20cm below your waistline.
            </li>
            <li>
              <strong className="text-foreground">Length:</strong> Measure vertically from the
              highest point of your shoulder down to your desired hemline.
            </li>
          </ul>
        </div>
      </ModalSheetContent>
    </ModalSheet>
  );
}
