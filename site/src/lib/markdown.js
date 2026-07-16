import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true });

// READMEs come from repository files, not user input, but they're still
// external content by the time they reach dangerouslySetInnerHTML — sanitize
// before render rather than trusting the repo to never contain raw HTML.
export function renderMarkdown(md) {
  return DOMPurify.sanitize(marked.parse(md ?? ""));
}
