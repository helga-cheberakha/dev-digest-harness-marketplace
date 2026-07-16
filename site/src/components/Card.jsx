import { statusColors } from "../data/statusColors.js";
import { strings, statusLabel } from "../i18n/strings.js";
import CopyButton from "./CopyButton.jsx";

export default function Card({ item, onOpen }) {
  const isPlugin = item.type === "plugin";

  return (
    <div className="card">
      <div className="card-top">
        <span className={`badge-type type-${item.type}`}>{item.type}</span>
        <span className="card-spacer" />
        <span className="card-status">
          <span className="status-dot" style={{ background: statusColors[item.status] }} />
          <span>{statusLabel(item.status)}</span>
        </span>
      </div>
      <div className="card-title-row">
        <button
          type="button"
          className="card-title"
          onClick={() => onOpen(item.pluginName, isPlugin ? null : item.name)}
        >
          {item.displayName}
        </button>
        <span className="card-name">{item.name}</span>
      </div>
      <p className="card-desc">{item.description}</p>
      {item.keywords.length > 0 && (
        <div className="chips">
          {item.keywords.map((kw) => (
            <span className="chip" key={kw}>
              {kw}
            </span>
          ))}
        </div>
      )}
      {!isPlugin && (
        <div className="card-part">
          {strings.card.partOf}{" "}
          <button type="button" onClick={() => onOpen(item.pluginName, item.name)}>
            {item.pluginName}
          </button>
        </div>
      )}
      <div className="install-row">
        <code className="install-cmd">{item.installCommand}</code>
        <CopyButton text={item.installCommand} />
      </div>
      {isPlugin && (
        <button type="button" className="view-details-btn" onClick={() => onOpen(item.pluginName, null)}>
          {strings.card.viewDetails}
        </button>
      )}
    </div>
  );
}
