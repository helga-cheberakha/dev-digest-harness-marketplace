import { statusColors } from "../data/statusColors.js";
import { strings, statusLabel, dependencyCountText } from "../i18n/strings.js";

const NODE_W = 230;
const NODE_H = 84;
const GAP_X = 150;
const GAP_Y = 26;

// Layout by dependency depth (no deps → column 0, arrows always point left)
// rather than hardcoded per-name coordinates, so a newly added plugin gets a
// sensible position automatically on the next reindex instead of crashing.
function layoutColumns(plugins) {
  const byName = new Map(plugins.map((p) => [p.name, p]));
  const depthCache = new Map();
  function depth(name, seen) {
    if (depthCache.has(name)) return depthCache.get(name);
    if (seen.has(name)) return 0; // dependency cycle guard
    const p = byName.get(name);
    const deps = p?.dependencies ?? [];
    const d = deps.length
      ? 1 + Math.max(...deps.map((dep) => (byName.has(dep) ? depth(dep, new Set(seen).add(name)) : 0)))
      : 0;
    depthCache.set(name, d);
    return d;
  }

  const columns = new Map();
  for (const p of plugins) {
    const d = depth(p.name, new Set());
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(p.name);
  }

  const pos = {};
  for (const [d, names] of columns) {
    names.forEach((name, i) => {
      pos[name] = { x: d * (NODE_W + GAP_X), y: i * (NODE_H + GAP_Y) };
    });
  }
  return pos;
}

export default function GraphView({ plugins, onOpen }) {
  const pos = layoutColumns(plugins);
  const maxX = Math.max(0, ...Object.values(pos).map((p) => p.x)) + NODE_W + 20;
  const maxY = Math.max(0, ...Object.values(pos).map((p) => p.y)) + NODE_H + 20;

  const edges = [];
  for (const p of plugins) {
    const from = pos[p.name];
    for (const dep of p.dependencies) {
      const to = pos[dep];
      if (!to) continue;
      edges.push({
        key: p.name + "->" + dep,
        x1: from.x,
        y1: from.y + NODE_H / 2,
        x2: to.x + NODE_W,
        y2: to.y + NODE_H / 2,
      });
    }
  }

  return (
    <main className="main main-graph">
      <h2 className="graph-title">{strings.graph.title}</h2>
      <p className="graph-intro">
        {strings.graph.introBefore} <code>{strings.graph.introCode}</code> {strings.graph.introAfter}
      </p>
      <div className="graph-legend">
        {Object.keys(statusColors).map((key) => (
          <span className="legend-item" key={key}>
            <span className="legend-dot" style={{ background: statusColors[key] }} />
            {statusLabel(key)}
          </span>
        ))}
      </div>
      <div className="graph-canvas">
        <div className="graph-inner" style={{ width: maxX, height: maxY }}>
          <svg width={maxX} height={maxY} className="graph-svg">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="#5f6b7e" />
              </marker>
            </defs>
            {edges.map((e) => (
              <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#3a4353" strokeWidth="1.6" markerEnd="url(#arrow)" />
            ))}
          </svg>
          {plugins.map((p) => {
            const q = pos[p.name];
            const depText = dependencyCountText(p.dependencies.length);
            return (
              <button
                key={p.name}
                type="button"
                className="graph-node"
                style={{ left: q.x, top: q.y, width: NODE_W, height: NODE_H }}
                onClick={() => onOpen(p.name, null)}
              >
                <div className="graph-node-top">
                  <span className="legend-dot" style={{ background: statusColors[p.status] }} />
                  <span className="graph-node-name">{p.displayName}</span>
                </div>
                <div className="graph-node-id">{p.name}</div>
                <div className="graph-node-dep">{depText}</div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
