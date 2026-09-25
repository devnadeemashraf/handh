'use client';

import { Edit2, Plus, Trash2, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerHaptic } from '@/lib/haptic';

import type { FamilyMember } from '@hh/domain';

export default function AccountFamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Self');
  const [abayaSize, setAbayaSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('M');
  const [hijabPref, setHijabPref] = useState('');
  const [ringSize, setRingSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [modestyLevel, setModestyLevel] = useState<'full_coverage' | 'moderate' | 'light'>(
    'full_coverage'
  );
  const [colorsInput, setColorsInput] = useState('');
  const [notes, setNotes] = useState('');

  const loadFamily = async () => {
    try {
      const res = await fetch('/api/user/family');
      const data = await res.json();
      if (data.success && Array.isArray(data.family)) {
        setMembers(data.family);
      }
    } catch {
      setError('Failed to load family member profiles.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, []);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setRelationship('Self');
    setAbayaSize('M');
    setHijabPref('');
    setRingSize('');
    setShoeSize('');
    setModestyLevel('full_coverage');
    setColorsInput('Emerald Green, Dusty Rose');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (mem: FamilyMember) => {
    setEditingMember(mem);
    setName(mem.name);
    setRelationship(mem.relationship || 'Self');
    setAbayaSize(mem.preferences?.sizes?.abaya || '');
    setHijabPref(mem.preferences?.sizes?.hijab || '');
    setRingSize(mem.preferences?.sizes?.ring || '');
    setShoeSize(mem.preferences?.sizes?.shoe || '');
    setModestyLevel(mem.preferences?.style?.modestyLevel || 'full_coverage');
    setColorsInput((mem.preferences?.style?.preferredColors || []).join(', '));
    setNotes(mem.preferences?.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const colors = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const preferences = {
      sizes: {
        ...(abayaSize ? { abaya: abayaSize } : {}),
        ...(hijabPref.trim() ? { hijab: hijabPref.trim() } : {}),
        ...(ringSize.trim() ? { ring: ringSize.trim() } : {}),
        ...(shoeSize.trim() ? { shoe: shoeSize.trim() } : {})
      },
      style: {
        ...(colors.length > 0 ? { preferredColors: colors } : {}),
        modestyLevel
      },
      ...(notes.trim() ? { notes: notes.trim() } : {})
    };

    const endpoint = editingMember ? `/api/user/family/${editingMember.id}` : '/api/user/family';
    const method = editingMember ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          relationship: relationship.trim() || undefined,
          preferences
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save family member.');
        return;
      }

      setShowModal(false);
      await loadFamily();
    } catch {
      setError('Network error while saving profile.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this family member profile?')) return;
    try {
      await fetch(`/api/user/family/${id}`, { method: 'DELETE' });
      await loadFamily();
    } catch {
      setError('Failed to delete member.');
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-1.5">
            Family Members & Size Profiles
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Store bespoke measurements, modest styling nuances, and size preferences for yourself
            and loved ones.
          </p>
        </div>

        <Button
          onClick={() => {
            triggerHaptic('selection');
            handleOpenAdd();
          }}
          className="gap-2 h-10 px-4 text-sm font-medium active:scale-[0.96] transition-transform duration-150"
        >
          <Plus className="h-4 w-4" /> Add Profile
        </Button>
      </div>

      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium mb-5">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm py-8 text-center animate-pulse">
          Loading family size profiles...
        </p>
      ) : members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-9 w-9 text-accent mx-auto mb-3" />
          <p className="font-serif text-lg font-semibold text-foreground mb-1">
            No Family Profiles Saved
          </p>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
            Add sizes for yourself, your daughter, spouse, or mother to make gifting and sizing
            effortless.
          </p>
          <Button
            onClick={() => {
              triggerHaptic('selection');
              handleOpenAdd();
            }}
            className="px-5 h-10 text-sm font-medium active:scale-[0.96] transition-transform duration-150"
          >
            Create First Profile
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((mem) => {
            const sizes = mem.preferences?.sizes || {};
            const style = mem.preferences?.style || {};

            return (
              <div
                key={mem.id}
                className="rounded-xl p-5 border border-border/80 bg-card hover:border-border transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">{mem.name}</span>
                      {mem.relationship && (
                        <Badge variant="secondary" className="text-[11px] font-semibold">
                          {mem.relationship}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          handleOpenEdit(mem);
                        }}
                        aria-label="Edit profile"
                        className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('heavy');
                          handleDelete(mem.id);
                        }}
                        aria-label="Delete profile"
                        className="text-destructive/80 hover:text-destructive p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sizes Pill Grid */}
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {sizes.abaya && (
                      <span className="text-xs bg-muted/50 border border-border/60 px-2.5 py-1 rounded-md text-foreground">
                        Abaya: <strong className="font-semibold">{sizes.abaya}</strong>
                      </span>
                    )}
                    {sizes.hijab && (
                      <span className="text-xs bg-muted/50 border border-border/60 px-2.5 py-1 rounded-md text-foreground">
                        Hijab: <strong className="font-semibold">{sizes.hijab}</strong>
                      </span>
                    )}
                    {sizes.ring && (
                      <span className="text-xs bg-muted/50 border border-border/60 px-2.5 py-1 rounded-md text-foreground">
                        Ring: <strong className="font-semibold">{sizes.ring}</strong>
                      </span>
                    )}
                    {sizes.shoe && (
                      <span className="text-xs bg-muted/50 border border-border/60 px-2.5 py-1 rounded-md text-foreground">
                        Shoe: <strong className="font-semibold">{sizes.shoe}</strong>
                      </span>
                    )}
                  </div>

                  {/* Modesty & Style */}
                  {style.modestyLevel && (
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Modesty Preference:{' '}
                      <strong className="text-foreground capitalize font-medium">
                        {style.modestyLevel.replace('_', ' ')}
                      </strong>
                    </p>
                  )}

                  {style.preferredColors && style.preferredColors.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className="text-[11px] text-muted-foreground">Favorite Tones:</span>
                      {style.preferredColors.map((col) => (
                        <span
                          key={col}
                          className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {mem.preferences?.notes && (
                  <p className="text-xs italic text-muted-foreground border-t border-border/60 pt-2.5 mt-2">
                    &ldquo;{mem.preferences.notes}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border/80 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="bg-primary px-6 py-4 text-primary-foreground flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">
                {editingMember ? 'Edit Size & Style Profile' : 'New Family Size Profile'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Fatima (Self) or Maryam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Self">Self</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Mother">Mother</option>
                    <option value="Sister">Sister</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
              </div>

              {/* Sizing Subsection */}
              <div className="p-3.5 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-xs font-semibold text-foreground block mb-2.5">
                  Standard Measurements & Fit
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Abaya Size
                    </label>
                    <select
                      value={abayaSize}
                      onChange={(e) =>
                        setAbayaSize(e.target.value as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '')
                      }
                      className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-foreground text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">None specified</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Hijab Preference / Size
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Chiffon 75x180"
                      value={hijabPref}
                      onChange={(e) => setHijabPref(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Ring Size (US)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. 6 or 7"
                      value={ringSize}
                      onChange={(e) => setRingSize(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Shoe Size (EU/UK)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. EU 38"
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Style & Colors */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Modesty Silhouette
                </label>
                <select
                  value={modestyLevel}
                  onChange={(e) =>
                    setModestyLevel(e.target.value as 'full_coverage' | 'moderate' | 'light')
                  }
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="full_coverage">
                    Full Coverage (Classic modesty, flowing drape)
                  </option>
                  <option value="moderate">Moderate Modesty (Tailored contemporary)</option>
                  <option value="light">Light (Minimalist everyday essentials)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Preferred Colors / Tones (comma-separated)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Emerald Green, Dusty Rose, Pearl White"
                  value={colorsInput}
                  onChange={(e) => setColorsInput(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Personal Notes / Fabric Sensitivities
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Allergic to nickel; prefers breathable organic crepe for monsoon"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-input bg-background text-foreground text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={() => triggerHaptic('selection')}
                  className="h-9 px-4 text-xs font-medium active:scale-[0.96] transition-transform duration-150"
                >
                  {editingMember ? 'Update Profile' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
