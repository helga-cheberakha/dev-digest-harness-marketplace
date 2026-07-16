import { useEffect, useState } from "react";

// Relative fetch — resolves against the current document URL, so it works
// identically in dev, in a build served from the Pages root, or from a
// repo subpath, with no base-path configuration to keep in sync.
export function useCatalog() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let alive = true;
    fetch("./index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`index.json: HTTP ${r.status}`))))
      .then((data) => {
        if (alive) setState({ status: "ready", data });
      })
      .catch((e) => {
        if (alive) setState({ status: "error", error: e.message });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
