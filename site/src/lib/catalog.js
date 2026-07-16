export function score(it, q) {
  const tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  const fields = [
    [it.displayName + " " + it.name, 10],
    [it.keywords.join(" "), 6],
    [it.description, 3],
    [it.pluginName, 2],
    [it.bodyText || "", 1], // full-text search over the README/skill/agent body
  ];
  let total = 0;
  for (const t of tokens) {
    let best = 0;
    for (const [f, w] of fields) if (f.toLowerCase().includes(t)) best = Math.max(best, w);
    if (best === 0) return -1;
    total += best;
  }
  return total;
}

export function matchesFilters(it, filters, excludeKey) {
  for (const key of ["type", "category", "status", "author"]) {
    if (key === excludeKey) continue;
    const sel = Object.keys(filters[key]).filter((k) => filters[key][k]);
    if (sel.length) {
      const v = key === "author" ? it.author : it[key];
      if (!sel.includes(v)) return false;
    }
  }
  return true;
}

export function badgeDataUri() {
  const label = "marketplace", value = "dev-digest-harness", lw = 76, vw = 132, h = 20;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + (lw + vw) + '" height="' + h + '">' +
    '<rect rx="3" width="' + (lw + vw) + '" height="' + h + '" fill="#333b49"/>' +
    '<rect rx="3" x="' + lw + '" width="' + vw + '" height="' + h + '" fill="#2f7a8c"/>' +
    '<rect x="' + lw + '" width="4" height="' + h + '" fill="#2f7a8c"/>' +
    '<g fill="#e6e9ef" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">' +
    '<text x="8" y="14">' + label + "</text>" +
    '<text x="' + (lw + 8) + '" y="14">' + value + "</text></g></svg>";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export function copyText(text, onDone) {
  const done = () => onDone && onDone();
  const fallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      // ignore
    }
    done();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}
