'use client';

import {
  AlertCircle,
  Layers,
  Loader2,
  PackagePlus,
  Palette,
  Plus,
  Sliders,
  Sparkles,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { resolveFilterFacets } from '@hh/domain';

import { ProductImageUploader, type UploadedImageItem } from './ProductImageUploader';

interface CategoryItem {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  path: string;
  depth: number;
  applicableFilterKeys: string[];
}

interface VariantInputState {
  sku: string;
  title: string;
  priceRupees: string;
  compareAtPriceRupees: string;
  initialQuantity: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Record<string, unknown>, newVariants: Record<string, unknown>[]) => void;
}

const DEPARTMENTS = [
  { value: 'men', label: "Men's Collection" },
  { value: 'women', label: "Women's Modest Wear" },
  { value: 'tech', label: 'Tech & Phone Protection' },
  { value: 'custom-merch', label: 'On-Demand Custom Merch' },
  { value: 'accessories', label: 'Handcrafted Accessories' }
];

export function AddProductDialog({ isOpen, onClose, onSuccess }: AddProductDialogProps) {
  const [activeTab, setActiveTab] = useState('basics');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State - Basics
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('men');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  // Form State - Specifications
  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  // Form State - Customization
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [allowCustomText, setAllowCustomText] = useState(true);
  const [allowImageUpload, setAllowImageUpload] = useState(true);
  const [maxCharacters, setMaxCharacters] = useState('30');
  const [surchargeRupees, setSurchargeRupees] = useState('150');
  const [productionDays, setProductionDays] = useState('3');
  const [customizationPlaceholder, setCustomizationPlaceholder] = useState(
    'Specify your custom text or placement instructions'
  );

  // Form State - Variants
  const [variants, setVariants] = useState<VariantInputState[]>([
    {
      sku: '',
      title: 'Standard',
      priceRupees: '',
      compareAtPriceRupees: '',
      initialQuantity: '10'
    }
  ]);

  // Form State - Images
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  // Fetch categories on open
  useEffect(() => {
    if (!isOpen) return;
    async function loadCategories() {
      setIsFetchingCategories(true);
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.flat)) {
          setCategories(data.flat);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsFetchingCategories(false);
      }
    }
    loadCategories();
  }, [isOpen]);

  // Auto-generate slug and default SKU when title changes
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const cleanSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(cleanSlug);

    // Auto-generate SKU for first variant if blank
    if (variants[0] && !variants[0].sku && val.trim().length > 2) {
      const prefix = val
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setVariants((prev) =>
        prev.map((v, i) => (i === 0 ? { ...v, sku: `HH-${prefix}-${randomSuffix}` } : v))
      );
    }
  };

  // Filter categories applicable to selected department
  const filteredCategories = categories.filter((cat) => {
    if (!cat.path) return true;
    return cat.path.startsWith(`/${department}`) || cat.depth === 0;
  });

  // Selected category object
  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const relevantFacets = currentCategory
    ? resolveFilterFacets(currentCategory.applicableFilterKeys || [])
    : [];

  // Variant helpers
  const handleAddVariant = () => {
    const nextIdx = variants.length + 1;
    const baseSku = variants[0]?.sku ? variants[0].sku.replace(/-\d+$/, '') : 'HH-PROD';
    setVariants([
      ...variants,
      {
        sku: `${baseSku}-0${nextIdx}`,
        title: `Variant ${nextIdx}`,
        priceRupees: variants[0]?.priceRupees || '',
        compareAtPriceRupees: '',
        initialQuantity: '10'
      }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantInputState, value: string) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  // Submission
  const handleSubmit = async () => {
    setErrorMessage(null);

    // 1. Basic validation
    if (!title.trim()) {
      setErrorMessage('Product title is required.');
      setActiveTab('basics');
      return;
    }

    if (variants.length === 0) {
      setErrorMessage('At least one variant is required.');
      setActiveTab('variants');
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v || !v.sku.trim()) {
        setErrorMessage(`Variant #${i + 1} requires a valid SKU.`);
        setActiveTab('variants');
        return;
      }
      const price = parseFloat(v.priceRupees);
      if (isNaN(price) || price <= 0) {
        setErrorMessage(`Variant #${i + 1} requires a positive selling price.`);
        setActiveTab('variants');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Parse tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      // Build payload matching createProductSchema
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        department,
        categoryId: selectedCategoryId || undefined,
        status,
        isCustomizable,
        customizationConfig: isCustomizable
          ? {
              allowCustomText,
              allowImageUpload,
              maxCharacters: parseInt(maxCharacters, 10) || 30,
              surchargeMinor: Math.round((parseFloat(surchargeRupees) || 0) * 100),
              productionDays: parseInt(productionDays, 10) || 3,
              customizationNotesPlaceholder: customizationPlaceholder
            }
          : null,
        specifications: specifications,
        tags,
        variants: variants.map((v, idx) => ({
          sku: v.sku.trim().toUpperCase(),
          title: v.title.trim() || `Variant ${idx + 1}`,
          priceMinor: Math.round(parseFloat(v.priceRupees) * 100),
          compareAtPriceMinor: v.compareAtPriceRupees
            ? Math.round(parseFloat(v.compareAtPriceRupees) * 100)
            : undefined,
          currency: 'INR',
          initialQuantity: parseInt(v.initialQuantity, 10) || 0,
          weightGrams: 50,
          sortOrder: idx,
          isActive: true
        })),
        images: images.map((img, idx) => ({
          storageKey: img.storageKey,
          url: img.url,
          altText: img.altText || title,
          sortOrder: idx
        }))
      };

      const res = await fetch('/api/admin/inventory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create piece');
      }

      onSuccess(data.product, data.variants);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Product creation failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden rounded-2xl bg-card border-border shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-serif font-bold text-foreground">
                Add New Artisan Piece
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Register a new SKU across apparel, footwear, tech protection, or on-demand custom
                merch.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-2 border-b border-border bg-background">
            <TabsList className="grid grid-cols-5 h-10 w-full bg-muted/40 p-1">
              <TabsTrigger value="basics" className="text-xs flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Basics</span>
              </TabsTrigger>
              <TabsTrigger value="specifications" className="text-xs flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                <span>Specs</span>
              </TabsTrigger>
              <TabsTrigger value="customization" className="text-xs flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Custom</span>
              </TabsTrigger>
              <TabsTrigger value="variants" className="text-xs flex items-center gap-1.5">
                <PackagePlus className="h-3.5 w-3.5" />
                <span>Variants ({variants.length})</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                <span>Gallery ({images.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {/* TAB 1: BASICS */}
            <TabsContent value="basics" className="space-y-4 m-0 focus-visible:outline-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Piece Title *</Label>
                  <Input
                    placeholder="e.g. Artisanal Heavyweight Graphic T-Shirt"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">URL Slug</Label>
                  <Input
                    placeholder="artisanal-heavyweight-graphic-tee"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Department *</Label>
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setSelectedCategoryId('');
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category / Subcategory</Label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    disabled={isFetchingCategories}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Select Specific Subcategory --</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.depth > 1 ? `↳ ${cat.name}` : cat.name} ({cat.path})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Catalog Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="published">Published (Live on Storefront)</option>
                    <option value="draft">Draft (Admin Only)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea
                    placeholder="Craftsmanship details, material composition, sizing cues, and styling notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Tags (comma separated)</Label>
                  <Input
                    placeholder="streetwear, custom-print, heavyweight, summer-drop"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: SPECIFICATIONS */}
            <TabsContent
              value="specifications"
              className="space-y-4 m-0 focus-visible:outline-hidden"
            >
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Dynamic Category Facets
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  These attributes power instant customer filtering and technical specs on product
                  pages.
                </p>

                {relevantFacets.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Select a Category in the Basics tab to populate tailored specifications (e.g.
                    GSM, Fit, Device Model, Sole Material).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relevantFacets.map((facet) => (
                      <div key={facet.key} className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">
                          {facet.label} {facet.unit && `(${facet.unit})`}
                        </Label>
                        {facet.options && facet.options.length > 0 ? (
                          <select
                            value={specifications[facet.key] || ''}
                            onChange={(e) =>
                              setSpecifications({
                                ...specifications,
                                [facet.key]: e.target.value
                              })
                            }
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                          >
                            <option value="">Select {facet.label}...</option>
                            {facet.options.map((opt) => (
                              <option key={opt.value} value={opt.label}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            placeholder={`Enter ${facet.label.toLowerCase()}...`}
                            value={specifications[facet.key] || ''}
                            onChange={(e) =>
                              setSpecifications({
                                ...specifications,
                                [facet.key]: e.target.value
                              })
                            }
                            className="h-9 text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: CUSTOMIZATION */}
            <TabsContent
              value="customization"
              className="space-y-4 m-0 focus-visible:outline-hidden"
            >
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      On-Demand Customization Governance
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Enable customers to submit custom typography or artwork on special order.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomizable}
                      onChange={(e) => setIsCustomizable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {isCustomizable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id="allowCustomText"
                        checked={allowCustomText}
                        onChange={(e) => setAllowCustomText(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <label
                        htmlFor="allowCustomText"
                        className="text-xs font-medium text-foreground cursor-pointer"
                      >
                        Allow customer to input custom text / typography
                      </label>
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id="allowImageUpload"
                        checked={allowImageUpload}
                        onChange={(e) => setAllowImageUpload(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <label
                        htmlFor="allowImageUpload"
                        className="text-xs font-medium text-foreground cursor-pointer"
                      >
                        Allow customer to upload custom artwork / photo files
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Max Text Characters</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={maxCharacters}
                        onChange={(e) => setMaxCharacters(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Customization Surcharge (₹ INR)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        placeholder="150"
                        value={surchargeRupees}
                        onChange={(e) => setSurchargeRupees(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Production Turnaround (Days)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={productionDays}
                        onChange={(e) => setProductionDays(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold">Customer Instructions Prompt</Label>
                      <Input
                        placeholder="e.g. Specify your custom text or placement instructions"
                        value={customizationPlaceholder}
                        onChange={(e) => setCustomizationPlaceholder(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 4: VARIANTS & STOCK */}
            <TabsContent value="variants" className="space-y-4 m-0 focus-visible:outline-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Variant SKUs &amp; Inventory Quantities
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Define sizes, colors, pricing, and initial stock in hand.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add SKU Variant
                </Button>
              </div>

              <div className="space-y-3">
                {variants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border bg-card shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        SKU Code *
                      </Label>
                      <Input
                        placeholder="HH-MEN-TS-01"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Title (e.g. L / Charcoal)
                      </Label>
                      <Input
                        placeholder="Standard"
                        value={variant.title}
                        onChange={(e) => handleVariantChange(idx, 'title', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Price (₹) *
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1299"
                        value={variant.priceRupees}
                        onChange={(e) => handleVariantChange(idx, 'priceRupees', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Initial Stock
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.initialQuantity}
                        onChange={(e) =>
                          handleVariantChange(idx, 'initialQuantity', e.target.value)
                        }
                        className="h-8 text-xs font-mono font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariant(idx)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Remove variant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 5: GALLERY */}
            <TabsContent value="media" className="space-y-4 m-0 focus-visible:outline-hidden">
              <ProductImageUploader images={images} onChange={setImages} maxImages={6} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-4 px-6 border-t border-border bg-muted/20 flex flex-row items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {variants.length} SKU{variants.length > 1 ? 's' : ''} • {images.length} photo
            {images.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering Piece...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" />
                  <span>Create Piece &amp; Stock</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
