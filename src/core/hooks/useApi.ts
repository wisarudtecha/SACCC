// /src/hooks/useApi.ts
import { useState, useCallback } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiResult<T> {
  state: ApiState<T>;
  execute: (...args: unknown[]) => Promise<T>;
  reset: () => void;
}

export const useApi = <T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<T>
): UseApiResult<T> => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args: unknown[]): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { state, execute, reset };
};
