import { score, matchesFilters } from "../lib/catalog.js";
import { strings, categoryLabel, statusLabel } from "../i18n/strings.js";

const FACET_KEYS = [
  { key: "type", values: ["plugin", "skill", "agent"] },
  { key: "category", values: ["engineering-skills", "research", "review", "workflow"] },
  { key: "status", values: ["released", "in-progress", "planned"] },
];

function labelFor(key, v) {
  if (key === "category") return categoryLabel(v);
  if (key === "status") return statusLabel(v);
  return v;
}

// Scoped to query + every OTHER active filter group, so a sibling option's
// count stays meaningful even after you've checked something in its group.
function scopedList(index, query, filters, excludeKey) {
  let list = index;
  if (query.trim()) list = list.filter((it) => score(it, query) >= 0);
  return list.filter((it) => matchesFilters(it, filters, excludeKey));
}

export default function Facets({ index, query, filters, onToggle, onClearFilters }) {
  const authorValues = [...new Set(index.map((i) => i.author).filter(Boolean))];
  const groups = [...FACET_KEYS, { key: "author", values: authorValues }];

  const hasActive = ["type", "category", "status", "author"].some((k) => Object.values(filters[k]).some(Boolean));

  return (
    <aside className="facets">
      {groups.map((g) => {
        const scoped = scopedList(index, query, filters, g.key);
        return (
          <div className="facet-group" key={g.key}>
            <div className="facet-label">{strings.facets.groupLabels[g.key]}</div>
            <div className="facet-options">
              {g.values.map((v) => {
                const active = !!filters[g.key][v];
                const count = scoped.filter((it) => (g.key === "author" ? it.author : it[g.key]) === v).length;
                return (
                  <button
                    key={v}
                    type="button"
                    className={"facet-btn" + (active ? " active" : "")}
                    onClick={() => onToggle(g.key, v)}
                  >
                    <span className="facet-box">{active ? "✓" : ""}</span>
                    <span className="facet-name">{labelFor(g.key, v)}</span>
                    <span className="facet-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {hasActive && (
        <button type="button" className="clear-filters-btn" onClick={onClearFilters}>
          {strings.facets.clearAll}
        </button>
      )}
    </aside>
  );
}
