import { badgeDataUri } from "../lib/catalog.js";
import { strings } from "../i18n/strings.js";
import CopyButton from "./CopyButton.jsx";

const badgeSrc = badgeDataUri();
const badgeSnippet = "![marketplace](./public/badge.svg)";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img className="footer-badge" src={badgeSrc} alt="marketplace badge" />
        <div className="footer-snippet">
          <code>{badgeSnippet}</code>
          <CopyButton text={badgeSnippet} className="footer-copy-btn" label={strings.copy.copyBadge} />
        </div>
        <span className="footer-note">{strings.footer.note}</span>
      </div>
    </footer>
  );
}
