import { useEffect, useState } from "react";
import { loadPredictionAnalytics, type PredictionAnalytics } from "../../data/predictions";

export function usePredictions() {
  const [data, setData] = useState<PredictionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const result = await loadPredictionAnalytics();
        if (mounted) setData(result);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load prediction analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}