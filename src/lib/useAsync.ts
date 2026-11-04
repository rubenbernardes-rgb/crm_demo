import { useCallback, useEffect, useRef, useState } from "react";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Run an async loader and keep its result in state. Re-runs whenever any value
 * in `deps` changes. Pass a stable `loader` (e.g. via useCallback) plus the deps
 * that should trigger a refetch. `reload()` forces a refetch on demand.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Something went wrong" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    const cancel = run();
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  return { ...state, reload: run };
}
