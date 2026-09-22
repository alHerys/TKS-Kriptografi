import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';

hljs.registerLanguage('python', python);

export function highlightPython(code) {
  // Tokenize the whole file so multiline strings retain their Python context.
  const html = hljs.highlight(code.trimEnd(), { language: 'python' }).value;
  const template = document.createElement('template');
  // Highlight.js escapes source characters; this detached template contains only token markup.
  template.innerHTML = html;
  const lines = [[]];

  function visit(node, classes = '') {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split('\n').forEach((text, index) => {
        if (index) lines.push([]);
        if (text) lines.at(-1).push({ text, classes });
      });
    } else {
      const nextClasses = node.className || classes;
      node.childNodes.forEach((child) => visit(child, nextClasses));
    }
  }

  visit(template.content);
  // Render plain token text through Svelte, never inject source as live HTML.
  return lines;
}
