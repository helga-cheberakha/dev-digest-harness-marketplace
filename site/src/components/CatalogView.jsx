import { useMemo } from "react";
import SearchBar from "./SearchBar.jsx";
import Facets from "./Facets.jsx";
import Card from "./Card.jsx";
import { score, matchesFilters } from "../lib/catalog.js";
import { strings, resultCountNoun } from "../i18n/strings.js";

export default function CatalogView({
  index,
  query,
  filters,
  onQueryChange,
  onClearQuery,
  onToggleFilter,
  onClearFilters,
  onResetAll,
  onOpen,
}) {
  const results = useMemo(() => {
    let list = index.map((it) => ({ it, sc: score(it, query) }));
    if (query.trim()) list = list.filter((x) => x.sc >= 0);
    list = list.filter((x) => matchesFilters(x.it, filters));
    const order = { plugin: 0, skill: 1, agent: 2 };
    list.sort((a, b) => b.sc - a.sc || order[a.it.type] - order[b.it.type] || a.it.name.localeCompare(b.it.name));
    return list.map((x) => x.it);
  }, [index, query, filters]);

  return (
    <main className="main">
      <SearchBar query={query} onChange={onQueryChange} onClear={onClearQuery} />
      <div className="layout">
        <Facets index={index} query={query} filters={filters} onToggle={onToggleFilter} onClearFilters={onClearFilters} />
        <section>
          <div className="results-header">
            <span className="result-count-line">
              <b>{results.length}</b> {resultCountNoun(results.length)}
            </span>
            <span className="sort-label">
              {query.trim() ? strings.results.sortedByRelevance : strings.results.pluginsFirst}
            </span>
          </div>
          {results.length > 0 ? (
            <div className="grid">
              {results.map((it) => (
                <Card key={it.id} item={it} onOpen={onOpen} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-title">{strings.results.noMatchesTitle}</div>
              <div className="empty-desc">{strings.results.noMatchesDesc}</div>
              <button type="button" className="reset-btn" onClick={onResetAll}>
                {strings.results.resetAll}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
