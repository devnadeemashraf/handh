'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RECENT_SEARCHES_STORAGE_KEY = 'hh_recent_searches';
const MAX_RECENT_SEARCHES = 6;

interface SearchContextValue {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  query: string;
  setQuery: (q: string) => void;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Ignore localStorage access failures
    }
  }, []);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const addRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage quota errors
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage error
      }
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Global keyboard shortcuts: Cmd+K / Ctrl+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSearch, closeSearch]);

  const value = useMemo(
    () => ({
      isOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      query,
      setQuery,
      recentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches
    }),
    [
      isOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      query,
      recentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches
    ]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

const defaultSearchContext: SearchContextValue = {
  isOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  toggleSearch: () => {},
  query: '',
  setQuery: () => {},
  recentSearches: [],
  addRecentSearch: () => {},
  removeRecentSearch: () => {},
  clearRecentSearches: () => {}
};

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  return context ?? defaultSearchContext;
}
