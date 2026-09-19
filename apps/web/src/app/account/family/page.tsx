'use client';

import { Edit2, Plus, Trash2, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
  const [modestyLevel, setModestyLevel] = useState<'full_coverage' | 'moderate' | 'light'>('full_coverage');
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
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EBE7DF',
        borderRadius: '12px',
        padding: '28px',
        boxShadow: '0 4px 12px rgba(10, 46, 36, 0.03)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F0ECE4',
          paddingBottom: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              color: '#0A2E24',
              margin: '0 0 6px'
            }}
          >
            Family Members & Size Profiles
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#5C6460' }}>
            Store bespoke measurements, modest styling nuances, and size preferences for yourself and loved ones.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#0A2E24',
            color: '#FDFBF7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Add Profile
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px',
            color: '#991B1B',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: '#5C6460' }}>Loading family size profiles...</p>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Users size={36} color="#C5A880" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: '#0A2E24', margin: '0 0 4px' }}>
            No Family Profiles Saved
          </p>
          <p style={{ fontSize: '0.85rem', color: '#5C6460', margin: '0 0 16px' }}>
            Add sizes for yourself, your daughter, spouse, or mother to make gifting and sizing effortless.
          </p>
          <button
            onClick={handleOpenAdd}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0A2E24',
              color: '#FDFBF7',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create First Profile
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {members.map((mem) => {
            const sizes = mem.preferences?.sizes || {};
            const style = mem.preferences?.style || {};

            return (
              <div
                key={mem.id}
                style={{
                  border: '1px solid #EBE7DF',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(10, 46, 36, 0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0A2E24' }}>
                      {mem.name}
                    </span>
                    {mem.relationship && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#F5EFE6',
                          color: '#0A2E24',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}
                      >
                        {mem.relationship}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(mem)}
                      aria-label="Edit profile"
                      style={{ background: 'none', border: 'none', color: '#5C6460', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(mem.id)}
                      aria-label="Delete profile"
                      style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Sizes Pill Grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {sizes.abaya && (
                    <span style={{ fontSize: '0.78rem', backgroundColor: '#FBF9F5', border: '1px solid #EBE7DF', padding: '4px 8px', borderRadius: '6px' }}>
                      Abaya: <strong>{sizes.abaya}</strong>
                    </span>
                  )}
                  {sizes.hijab && (
                    <span style={{ fontSize: '0.78rem', backgroundColor: '#FBF9F5', border: '1px solid #EBE7DF', padding: '4px 8px', borderRadius: '6px' }}>
                      Hijab: <strong>{sizes.hijab}</strong>
                    </span>
                  )}
                  {sizes.ring && (
                    <span style={{ fontSize: '0.78rem', backgroundColor: '#FBF9F5', border: '1px solid #EBE7DF', padding: '4px 8px', borderRadius: '6px' }}>
                      Ring: <strong>{sizes.ring}</strong>
                    </span>
                  )}
                  {sizes.shoe && (
                    <span style={{ fontSize: '0.78rem', backgroundColor: '#FBF9F5', border: '1px solid #EBE7DF', padding: '4px 8px', borderRadius: '6px' }}>
                      Shoe: <strong>{sizes.shoe}</strong>
                    </span>
                  )}
                </div>

                {/* Modesty & Style */}
                {style.modestyLevel && (
                  <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#5C6460' }}>
                    Modesty Preference:{' '}
                    <strong style={{ color: '#0A2E24', textTransform: 'capitalize' }}>
                      {style.modestyLevel.replace('_', ' ')}
                    </strong>
                  </p>
                )}

                {style.preferredColors && style.preferredColors.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8C928F' }}>Favorite Tones:</span>
                    {style.preferredColors.map((col) => (
                      <span
                        key={col}
                        style={{
                          fontSize: '0.72rem',
                          backgroundColor: '#ECFDF5',
                          color: '#065F46',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                )}

                {mem.preferences?.notes && (
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: '0.78rem',
                      fontStyle: 'italic',
                      color: '#5C6460',
                      borderTop: '1px solid #F0ECE4',
                      paddingTop: '8px'
                    }}
                  >
                    "{mem.preferences.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(10, 46, 36, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EBE7DF',
              boxShadow: '0 24px 48px rgba(10, 46, 36, 0.2)'
            }}
          >
            <div
              style={{
                backgroundColor: '#0A2E24',
                padding: '18px 24px',
                color: '#FDFBF7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
                {editingMember ? 'Edit Size & Style Profile' : 'New Family Size Profile'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#FDFBF7', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fatima (Self) or Maryam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px', backgroundColor: '#FFFFFF' }}
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
              <div style={{ padding: '12px', backgroundColor: '#FBF9F5', borderRadius: '8px', border: '1px solid #F0ECE4' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0A2E24', display: 'block', marginBottom: '10px' }}>
                  Standard Measurements & Fit
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#5C6460', marginBottom: '2px' }}>
                      Abaya Size
                    </label>
                    <select
                      value={abayaSize}
                      onChange={(e) =>
                        setAbayaSize(e.target.value as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '')
                      }
                      style={{ width: '100%', padding: '8px', border: '1px solid #EBE7DF', borderRadius: '6px', backgroundColor: '#FFFFFF' }}
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
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#5C6460', marginBottom: '2px' }}>
                      Hijab Preference / Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chiffon 75x180"
                      value={hijabPref}
                      onChange={(e) => setHijabPref(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#5C6460', marginBottom: '2px' }}>
                      Ring Size (US)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 6 or 7"
                      value={ringSize}
                      onChange={(e) => setRingSize(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#5C6460', marginBottom: '2px' }}>
                      Shoe Size (EU/UK)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EU 38"
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Style & Colors */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                  Modesty Silhouette
                </label>
                <select
                  value={modestyLevel}
                  onChange={(e) =>
                    setModestyLevel(e.target.value as 'full_coverage' | 'moderate' | 'light')
                  }
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="full_coverage">Full Coverage (Classic modesty, flowing drape)</option>
                  <option value="moderate">Moderate Modesty (Tailored contemporary)</option>
                  <option value="light">Light (Minimalist everyday essentials)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                  Preferred Colors / Tones (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emerald Green, Dusty Rose, Pearl White"
                  value={colorsInput}
                  onChange={(e) => setColorsInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                  Personal Notes / Fabric Sensitivities
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Allergic to nickel; prefers breathable organic crepe for monsoon"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 16px', border: '1px solid #EBE7DF', borderRadius: '6px', background: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', backgroundColor: '#0A2E24', color: '#FDFBF7', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingMember ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
