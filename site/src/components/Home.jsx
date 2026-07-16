import { useMemo } from "react";
import CopyButton from "./CopyButton.jsx";
import { strings } from "../i18n/strings.js";

function flattenUpdates(plugins) {
  const items = [];
  for (const p of plugins) {
    for (const c of p.changelog) {
      items.push({ plugin: p, version: c.version, date: c.date, changes: c.changes });
    }
  }
  items.sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.plugin.displayName.localeCompare(b.plugin.displayName));
  return items.slice(0, 8);
}

export default function Home({ catalog, entries, plugins, onOpen, onNavCatalog, onNavGraph }) {
  const stats = useMemo(() => {
    const counts = { plugin: 0, skill: 0, agent: 0 };
    for (const e of entries) counts[e.type] = (counts[e.type] || 0) + 1;
    const categories = new Set(plugins.map((p) => p.category).filter(Boolean));
    return { ...counts, categories: categories.size };
  }, [entries, plugins]);

  const updates = useMemo(() => flattenUpdates(plugins), [plugins]);

  const ghBase = `https://github.com/${catalog.repoSlug}`;
  const marketplaceAddCmd = `/plugin marketplace add ${catalog.repoSlug}`;
  const pluginUpdateCmd = `/plugin update <plugin>@${catalog.name}`;
  const generated = catalog.generatedAt
    ? new Date(catalog.generatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <main className="main main-home">
      <section className="home-hero">
        <h1 className="home-title">{catalog.name}</h1>
        <p className="home-tagline">{catalog.description || strings.home.fallbackTagline}</p>
        <div className="home-hero-actions">
          <button type="button" className="home-cta primary" onClick={onNavCatalog}>
            {strings.home.browseCatalogCta}
          </button>
          <button type="button" className="home-cta" onClick={onNavGraph}>
            {strings.home.browseGraphCta}
          </button>
        </div>
      </section>

      <section className="home-section home-install">
        <h2 className="home-section-title">{strings.home.installTitle}</h2>
        <p className="home-section-hint">{strings.home.installHint}</p>
        <div className="home-install-row">
          <code>{marketplaceAddCmd}</code>
          <CopyButton text={marketplaceAddCmd} />
        </div>
        <p className="home-install-step2">
          {strings.home.installStepTwoLabel} — {strings.home.installStepTwoHint}{" "}
          <button type="button" className="home-inline-link" onClick={onNavCatalog}>
            {strings.home.installStepTwoLink}
          </button>
          .
        </p>
      </section>

      <section className="home-section home-stats">
        <h2 className="home-section-title">{strings.home.statsTitle}</h2>
        <div className="stats-grid">
          <div className="stat-tile">
            <span className="stat-value">{stats.plugin}</span>
            <span className="stat-label">{strings.home.statsPlugins}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.skill}</span>
            <span className="stat-label">{strings.home.statsSkills}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.agent}</span>
            <span className="stat-label">{strings.home.statsAgents}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{stats.categories}</span>
            <span className="stat-label">{strings.home.statsCategories}</span>
          </div>
        </div>
      </section>

      <section className="home-section home-updates">
        <div className="home-section-head">
          <h2 className="home-section-title">{strings.home.updatesTitle}</h2>
          <button type="button" className="home-inline-link" onClick={onNavCatalog}>
            {strings.home.updatesViewAll}
          </button>
        </div>
        {updates.length === 0 ? (
          <p className="home-section-hint">{strings.home.updatesEmpty}</p>
        ) : (
          <div className="home-updates-list">
            {updates.map((u) => (
              <button
                type="button"
                key={u.plugin.name + u.version}
                className="home-update-row"
                onClick={() => onOpen(u.plugin.name, null)}
              >
                <span className="home-update-top">
                  <span className="badge-type type-plugin">plugin</span>
                  <span className="home-update-name">{u.plugin.displayName}</span>
                  <span className="changelog-version">v{u.version}</span>
                  <span className="changelog-date">{u.date}</span>
                </span>
                <span className="home-update-desc">{u.changes[0]}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-section home-browse">
        <h2 className="home-section-title">{strings.home.browseTitle}</h2>
        <div className="home-browse-grid">
          <button type="button" className="home-browse-card" onClick={onNavCatalog}>
            <div className="home-browse-card-title">{strings.home.browseCatalogTitle}</div>
            <p className="home-browse-card-desc">{strings.home.browseCatalogDesc}</p>
            <span className="home-browse-cta">{strings.home.browseCatalogCta}</span>
          </button>
          <button type="button" className="home-browse-card" onClick={onNavGraph}>
            <div className="home-browse-card-title">{strings.home.browseGraphTitle}</div>
            <p className="home-browse-card-desc">{strings.home.browseGraphDesc}</p>
            <span className="home-browse-cta">{strings.home.browseGraphCta}</span>
          </button>
        </div>
      </section>

      <section className="home-section home-meta">
        <h2 className="home-section-title">{strings.home.goodToKnowTitle}</h2>
        <div className="home-meta-grid">
          <div className="home-meta-item">
            <div className="home-meta-label">{strings.home.updatingCatalogLabel}</div>
            <code>{strings.home.updatingCatalogCmd}</code>
            <p>{strings.home.updatingCatalogDesc}</p>
          </div>
          <div className="home-meta-item">
            <div className="home-meta-label">{strings.home.updatingInstalledLabel}</div>
            <code>{pluginUpdateCmd}</code>
            <p>{strings.home.updatingInstalledDesc}</p>
          </div>
        </div>
        <div className="home-meta-links">
          <a href={ghBase} target="_blank" rel="noopener noreferrer">
            {strings.home.repository}
          </a>
          <span>·</span>
          <a href={`${ghBase}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">
            {strings.home.contributing}
          </a>
          <span>·</span>
          <a href={`${ghBase}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
            {strings.home.license}
          </a>
        </div>
        {generated && (
          <p className="home-generated">
            {strings.home.generatedAtPrefix} {generated}
          </p>
        )}
      </section>
    </main>
  );
}
