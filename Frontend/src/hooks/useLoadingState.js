import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states in forms
 * Provides loading state, start/stop functions, and async wrapper
 */
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  // Wrapper for async functions with automatic loading state
  const withLoading = useCallback(async (asyncFunction) => {
    try {
      setLoading(true);
      const result = await asyncFunction();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
};

export default useLoadingState;
