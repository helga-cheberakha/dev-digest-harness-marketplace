import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Home from "./components/Home.jsx";
import CatalogView from "./components/CatalogView.jsx";
import GraphView from "./components/GraphView.jsx";
import PluginDetail from "./components/PluginDetail.jsx";
import Footer from "./components/Footer.jsx";
import { useCatalog } from "./data/useCatalog.js";
import { strings } from "./i18n/strings.js";

function parseUrlState() {
  const p = new URLSearchParams(window.location.search);
  const filters = { type: {}, category: {}, status: {}, author: {} };
  for (const key of ["type", "category", "status"]) {
    const v = p.get(key);
    if (v) v.split(",").forEach((x) => { filters[key][x] = true; });
  }
  let view = p.get("view");
  if (!["home", "catalog", "graph", "detail"].includes(view)) {
    // No (valid) explicit view: a search/filter link still means "show results",
    // everything else lands on the home page.
    const hasSearchState = p.get("q") || ["type", "category", "status"].some((k) => p.get(k));
    view = hasSearchState ? "catalog" : "home";
  }
  return {
    query: p.get("q") || "",
    filters,
    view,
    selectedPlugin: p.get("plugin") || null,
    anchor: p.get("section") || null,
  };
}

const EMPTY_FILTERS = { type: {}, category: {}, status: {}, author: {} };

export default function App() {
  const catalog = useCatalog();
  const [initial] = useState(parseUrlState);
  const [query, setQuery] = useState(initial.query);
  const [filters, setFilters] = useState(initial.filters);
  const [view, setView] = useState(initial.view);
  const [selectedPlugin, setSelectedPlugin] = useState(initial.selectedPlugin);
  const [pendingAnchor, setPendingAnchor] = useState(initial.anchor);

  const entries = catalog.status === "ready" ? catalog.data.entries : [];
  const plugins = useMemo(() => entries.filter((e) => e.type === "plugin"), [entries]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    for (const key of ["type", "category", "status"]) {
      const sel = Object.keys(filters[key]).filter((k) => filters[key][k]);
      if (sel.length) p.set(key, sel.join(","));
    }
    if (view !== "home") p.set("view", view);
    if (view === "detail" && selectedPlugin) p.set("plugin", selectedPlugin);
    const qs = p.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }, [query, filters, view, selectedPlugin]);

  function goHome() {
    setView("home");
    setSelectedPlugin(null);
    setPendingAnchor(null);
    window.scrollTo({ top: 0 });
  }
  function goCatalog() {
    setView("catalog");
    setSelectedPlugin(null);
    setPendingAnchor(null);
    window.scrollTo({ top: 0 });
  }
  function goGraph() {
    setView("graph");
    setSelectedPlugin(null);
    setPendingAnchor(null);
    window.scrollTo({ top: 0 });
  }
  function openPlugin(name, anchor) {
    setSelectedPlugin(name);
    setPendingAnchor(anchor || null);
    setView("detail");
    if (!anchor) window.scrollTo({ top: 0 });
  }
  function toggleFilter(key, val) {
    setFilters((f) => ({ ...f, [key]: { ...f[key], [val]: !f[key][val] } }));
  }
  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }
  function resetAll() {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  }

  if (catalog.status !== "ready") {
    return (
      <div className="page">
        <Header unitCount={0} view="home" onNavHome={() => {}} onNavCatalog={() => {}} onNavGraph={() => {}} />
        <main className="main">
          <div className="empty-state">
            <div className="empty-title">
              {catalog.status === "error" ? strings.loading.errorTitle : strings.loading.title}
            </div>
            {catalog.status === "error" && <div className="empty-desc">{strings.loading.errorDesc}</div>}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Header
        unitCount={entries.length}
        view={view}
        onNavHome={goHome}
        onNavCatalog={goCatalog}
        onNavGraph={goGraph}
      />

      {view === "home" && (
        <Home
          catalog={catalog.data}
          entries={entries}
          plugins={plugins}
          onOpen={openPlugin}
          onNavCatalog={goCatalog}
          onNavGraph={goGraph}
        />
      )}
      {view === "catalog" && (
        <CatalogView
          index={entries}
          query={query}
          filters={filters}
          onQueryChange={setQuery}
          onClearQuery={() => setQuery("")}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          onResetAll={resetAll}
          onOpen={openPlugin}
        />
      )}
      {view === "graph" && <GraphView plugins={plugins} onOpen={openPlugin} />}
      {view === "detail" && (
        <PluginDetail
          entries={entries}
          name={selectedPlugin}
          anchor={pendingAnchor}
          onConsumeAnchor={() => setPendingAnchor(null)}
          onOpen={openPlugin}
          onBack={goCatalog}
        />
      )}

      <Footer />
    </div>
  );
}
