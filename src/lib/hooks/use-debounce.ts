// src/lib/hooks/use-debounce.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any rapidly changing value (e.g. search input).
 * Immediately synchronizes if value is cleared to empty string, and delays
 * propagating keystrokes by the specified debounce duration (default: 400ms).
 *
 * @param value The value to debounce
 * @param delay Milliseconds to delay updates (default: 400ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // If string value is cleared to empty, clear immediately without waiting
    if (typeof value === 'string' && value === '' && debouncedValue !== '') {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
