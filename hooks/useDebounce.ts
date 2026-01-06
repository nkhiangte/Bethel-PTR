import { useState, useEffect } from 'react';

// Custom hook for debouncing a value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear the timeout if value changes before the delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run if value or delay changes

  return debouncedValue;
}
