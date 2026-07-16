import { useEffect, useRef, useState } from "react";
import { copyText } from "../lib/catalog.js";
import { strings } from "../i18n/strings.js";

export default function CopyButton({ text, className = "copy-btn", label = strings.copy.copy }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleClick() {
    copyText(text, () => {
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button type="button" className={className + (copied ? " copied" : "")} onClick={handleClick}>
      <span>{copied ? strings.copy.copied : label}</span>
    </button>
  );
}
