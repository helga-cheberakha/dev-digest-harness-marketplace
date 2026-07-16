import { strings } from "../i18n/strings.js";

export default function Header({ unitCount, view, onNavHome, onNavCatalog, onNavGraph }) {
  const catalogActive = view === "catalog" || view === "detail";

  return (
    <header className="header">
      <div className="header-inner">
        <button className="brand" type="button" data-action="nav-home" onClick={onNavHome}>
          <span className="brand-mark" />
          <span className="brand-text">
            <span className="brand-name">{strings.brand.name}</span>
            <span className="brand-sub">{strings.brand.tagline}</span>
          </span>
        </button>
        <nav className="nav">
          <button
            type="button"
            className={"nav-btn" + (view === "home" ? " active" : "")}
            data-action="nav-home"
            onClick={onNavHome}
          >
            {strings.nav.home}
          </button>
          <button
            type="button"
            className={"nav-btn" + (catalogActive ? " active" : "")}
            data-action="nav-catalog"
            onClick={onNavCatalog}
          >
            {strings.nav.catalog}
          </button>
          <button
            type="button"
            className={"nav-btn" + (view === "graph" ? " active" : "")}
            data-action="nav-graph"
            onClick={onNavGraph}
          >
            {strings.nav.dependencies}
          </button>
        </nav>
        <div className="header-right">
          <span className="unit-count">
            {unitCount} {strings.header.unitsSuffix}
          </span>
          <a className="subscribe" href="./public/feed.xml" title={strings.header.subscribeTitle}>
            <span className="subscribe-dot" />
            {strings.header.subscribe}
          </a>
        </div>
      </div>
    </header>
  );
}
