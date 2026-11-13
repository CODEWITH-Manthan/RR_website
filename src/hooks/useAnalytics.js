import { useEffect, useState } from "react";
// Fetch the generated data asset separately from the application JavaScript.
export function useAnalytics() {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    const loader = import.meta.glob("../data/analytics.json", {
      query: "?url",
      import: "default",
    })["../data/analytics.json"];
    Promise.resolve()
      .then(() => {
        if (!loader)
          throw new Error(
            "Analytics data is missing. Run npm run prepare:data.",
          );
        return loader();
      })
      .then(async (url) => {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok)
          throw new Error(`Data request failed (${response.status}).`);
        return response.json();
      })
      .then((data) => {
        if (
          data.schemaVersion !== 2 ||
          !data.audit ||
          !Array.isArray(data.buckets)
        )
          throw new Error("The analytics data has an unsupported format.");
        if (active) setState({ data, loading: false, error: null });
      })
      .catch(
        (error) =>
          active &&
          setState({ data: null, loading: false, error: error.message }),
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
