import { useEffect, useState } from "react";
export const PAGES = [
  "Overview",
  "Pressure Index",
  "Batters",
  "Bowlers",
  "Shortlist",
  "Compare",
  "Methodology",
];
export const pageHref = (page) =>
  `#/${page.toLowerCase().replaceAll(" ", "-")}`;
export function useRoute() {
  const read = () =>
    PAGES.find((p) => pageHref(p) === window.location.hash) || "Overview";
  const [page, setPage] = useState(read);
  useEffect(() => {
    const handler = () => {
      setPage(read());
      window.scrollTo?.(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const navigate = (name) => {
    if (!PAGES.includes(name)) return;
    window.location.hash = pageHref(name);
    setPage(name);
  };
  return [page, navigate];
}
// Validating stored data prevents a stale or malformed browser cache breaking the app.
export function useStoredState(key, fallback, validate = () => true) {
  const [error, setError] = useState(false);
  const [value, setValue] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      return stored !== null && validate(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      setError(true);
    }
  }, [key, value]);
  return [value, setValue, error];
}
