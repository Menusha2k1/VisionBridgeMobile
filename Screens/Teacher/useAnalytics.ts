import { useEffect, useState } from "react";
import { loadAnalytics, type AnalyticsResult } from "../../data/analytics";

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await loadAnalytics();
        if (mounted) setData(res);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load analytics");
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