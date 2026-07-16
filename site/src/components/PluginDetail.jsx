import { useEffect, useState } from "react";
import { statusColors } from "../data/statusColors.js";
import { renderMarkdown } from "../lib/markdown.js";
import { strings, categoryLabel, statusLabel } from "../i18n/strings.js";
import CopyButton from "./CopyButton.jsx";

export default function PluginDetail({ entries, name, anchor, onConsumeAnchor, onOpen, onBack }) {
  const p = entries.find((e) => e.type === "plugin" && e.name === name);
  const skills = entries.filter((e) => e.type === "skill" && e.pluginName === name);
  const agents = entries.filter((e) => e.type === "agent" && e.pluginName === name);

  const [readmeHtml, setReadmeHtml] = useState(null);

  useEffect(() => {
    setReadmeHtml(null);
    if (!p?.bodyHtmlPath) return undefined;
    let alive = true;
    fetch(`./${p.bodyHtmlPath}`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((raw) => {
        if (alive) setReadmeHtml(renderMarkdown(raw));
      })
      .catch(() => {
        if (alive) setReadmeHtml("");
      });
    return () => {
      alive = false;
    };
  }, [p?.bodyHtmlPath]);

  useEffect(() => {
    if (!anchor || !p) return undefined;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById("sec-" + anchor);
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
      onConsumeAnchor();
    });
    return () => cancelAnimationFrame(raf);
  }, [anchor, p, onConsumeAnchor]);

  if (!p) {
    return (
      <main className="main main-detail">
        <button type="button" className="detail-back" onClick={onBack}>
          {strings.detail.back}
        </button>
        <p style={{ color: "#8b95a6" }}>{strings.detail.notFound}</p>
      </main>
    );
  }

  return (
    <main className="main main-detail">
      <button type="button" className="detail-back" onClick={onBack}>
        {strings.detail.back}
      </button>

      <div className="detail-top">
        <span className="badge-type type-plugin">plugin</span>
        <span className="card-status">
          <span className="status-dot" style={{ background: statusColors[p.status] }} />
          <span>{statusLabel(p.status)}</span>
        </span>
        <span className="detail-version">v{p.version}</span>
      </div>
      <div className="detail-title-row">
        <h1>{p.displayName}</h1>
        <span className="detail-name">{p.name}</span>
      </div>
      <p className="detail-desc">{p.description}</p>
      <div className="detail-meta">
        <span>{categoryLabel(p.category)}</span>
        <span>·</span>
        <span>
          {strings.detail.by} {p.author}
        </span>
        <span>·</span>
        <span>{p.license}</span>
        {p.homepage && (
          <a href={p.homepage} target="_blank" rel="noopener noreferrer">
            {strings.detail.homepage}
          </a>
        )}
        <a href={p.repository || p.githubUrl} target="_blank" rel="noopener noreferrer">
          {strings.detail.repository}
        </a>
      </div>
      <div className="detail-install">
        <code>{p.installCommand}</code>
        <CopyButton text={p.installCommand} />
      </div>

      {p.dependencies.length > 0 && (
        <div className="detail-deps">
          <div className="detail-deps-label">{strings.detail.dependsOn}</div>
          <div className="detail-deps-list">
            {p.dependencies.map((dep) => (
              <button key={dep} type="button" className="dep-chip" onClick={() => onOpen(dep, null)}>
                <span className="dep-dot" />
                <span className="dep-chip-name">{dep}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div>
          {skills.map((s) => (
            <div className="component-card" id={`sec-${s.name}`} key={s.id}>
              <div className="component-top">
                <span className="component-badge type-skill">skill</span>
                <span className="component-name">{s.displayName}</span>
                <span className="component-id">{s.name}</span>
              </div>
              <p className="component-desc">{s.description}</p>
            </div>
          ))}
          {agents.map((a) => (
            <div className="component-card" id={`sec-${a.name}`} key={a.id}>
              <div className="component-top">
                <span className="component-badge type-agent">agent</span>
                <span className="component-name">{a.displayName}</span>
                <span className="component-id">{a.name}</span>
              </div>
              <p className="component-desc has-tools">{a.description}</p>
              <div className="tools-row">
                <span className="tools-label">{strings.detail.tools}</span>
                {a.tools.map((t) => (
                  <span className="tool-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <h3 className="readme-heading">{strings.detail.readme}</h3>
          {readmeHtml === null ? (
            <div className="readme-box">{strings.detail.readmeLoading}</div>
          ) : readmeHtml === "" ? (
            <div className="readme-box">{strings.detail.readmeEmpty}</div>
          ) : (
            <div className="readme-box" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
          )}
        </div>

        <aside className="detail-aside">
          <div className="changelog-label">{strings.detail.changelog}</div>
          <div className="changelog-list">
            {p.changelog.map((c) => (
              <div className="changelog-entry" key={c.version}>
                <div className="changelog-top">
                  <span className="changelog-version">{c.version}</span>
                  <span className="changelog-date">{c.date}</span>
                </div>
                <ul className="changelog-changes">
                  {c.changes.map((ch, i) => (
                    <li key={i}>{ch}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
