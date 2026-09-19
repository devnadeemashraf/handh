'use client';

import { useState } from 'react';
import { Lock, Key, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginForm({ initialKey }: { initialKey: string }) {
  const [key, setKey] = useState(initialKey);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Hard navigation to trigger Server Component layout session re-evaluation
      window.location.href = '/admin/orders';
    } catch {
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div className="admin-alert-error">
          <AlertCircle
            style={{
              width: '16px',
              height: '16px',
              flexShrink: 0,
              marginTop: '2px',
              color: '#F87171'
            }}
          />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#A0C0B5',
            fontWeight: 600,
            marginBottom: '8px'
          }}
        >
          Access Gateway Key
        </label>
        <div style={{ position: 'relative' }}>
          <Key
            style={{
              width: '16px',
              height: '16px',
              color: '#608578',
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter stealth access key"
            className="admin-input"
            style={{ paddingLeft: '42px' }}
          />
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#A0C0B5',
            fontWeight: 600,
            marginBottom: '8px'
          }}
        >
          Master Password
        </label>
        <div style={{ position: 'relative' }}>
          <Lock
            style={{
              width: '16px',
              height: '16px',
              color: '#608578',
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="admin-input"
            style={{ paddingLeft: '42px' }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="admin-btn-primary"
        style={{
          width: '100%',
          marginTop: '8px',
          minHeight: '48px',
          fontSize: '0.9375rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        {isLoading ? (
          <>
            <Loader2
              style={{
                width: '18px',
                height: '18px',
                animation: 'spin 1s linear infinite'
              }}
            />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>Enter Workshop Portal</span>
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </>
        )}
      </button>
    </form>
  );
}
