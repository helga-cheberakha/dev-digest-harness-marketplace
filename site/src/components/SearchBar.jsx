import { strings } from "../i18n/strings.js";

export default function SearchBar({ query, onChange, onClear }) {
  return (
    <div className="search-wrap">
      <span className="search-icon">⌕</span>
      <input
        id="search-input"
        className="search-input"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={strings.search.placeholder}
        autoComplete="off"
      />
      {query && (
        <button type="button" className="search-clear" onClick={onClear} aria-label={strings.search.clear}>
          ✕
        </button>
      )}
    </div>
  );
}
