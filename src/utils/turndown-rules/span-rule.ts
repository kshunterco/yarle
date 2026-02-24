// src/utils/turndown-rules/span-rule.ts

import { yarleOptions } from '../../yarle';

import { filterByNodeName } from './filter-by-nodename';
import { getAttributeProxy } from './get-attribute-proxy';
import { parseInlineStyle } from './parse-inline-style';

import { getLanguageItems } from './../../outputLanguages/LanguageFactory';

const EVERNOTE_HIGHLIGHT = '-evernote-highlight:true;';
const EVERNOTE_COLORHIGHLIGHT = '--en-highlight';

const BOLD = 'bold';
const ITALIC = 'italic';

// ---- helpers (safe with Evernote’s extra CSS like --inversion-type-color:...) ----
function buildSpanStyle(css: Record<string, string>): string {
  const parts: string[] = [];

  if (yarleOptions.preserveColorsAsHtml) {
    if (css['color']) parts.push(`color:${css['color']}`);
    if (css['background-color']) parts.push(`background-color:${css['background-color']}`);
  }

  if (yarleOptions.preserveFontSizeAsHtml) {
    if (css['font-size']) parts.push(`font-size:${css['font-size']}`);
    // if (css['font-family']) parts.push(`font-family:${css['font-family']}`);
  }

  return parts.join(';');
}

function isUnderline(css: Record<string, string>): boolean {
  const td = (css['text-decoration'] || '').toLowerCase();
  const tdl = (css['text-decoration-line'] || '').toLowerCase();
  return td.includes('underline') || tdl.includes('underline');
}

// ---- Rule ----
export const spanRule = {
  filter: filterByNodeName('SPAN'),
  replacement: (content: any, node: any) => {
    const nodeProxy = getAttributeProxy(node);
    if (!nodeProxy.style || content.trim() === '') return content;

    // Preserve YARLE’s newline placeholder behavior
    if (content === '<YARLE_NEWLINE_PLACEHOLDER>') return content;

    const nodeValue: string = nodeProxy.style.value;
    const css = parseInlineStyle(nodeValue);

    const languageItems = getLanguageItems(yarleOptions.outputFormat);

    // ---- Existing bold/italic conversion (keeps markdown for emphasis) ----
    const fw = (css['font-weight'] || '').toLowerCase();
    const fs = (css['font-style'] || '').toLowerCase();

    const hasBold =
      fw.includes(BOLD) ||
      nodeValue.includes(BOLD); // keep legacy behavior in case style parsing misses
    const hasItalic =
      fs.includes(ITALIC) ||
      nodeValue.includes(ITALIC);

    if (hasBold && !hasItalic) content = `${languageItems.bold}${content}${languageItems.bold}`;
    if (!hasBold && hasItalic) content = `${languageItems.italic}${content}${languageItems.italic}`;
    if (hasBold && hasItalic) {
      content = `${languageItems.italic}${languageItems.bold}${content}${languageItems.bold}${languageItems.italic}`;
    }

    let wrapped = content;
    const style = buildSpanStyle(css);
    if (style) {
      wrapped = `<span style="${style}">${wrapped}</span>`;
    }
    if (yarleOptions.preserveUnderlineAsHtml && isUnderline(css)) {
      wrapped = `<u>${wrapped}</u>`;
    }
    if (wrapped !== content) return wrapped;

    // If we're preserving colors as HTML, never convert colors to MD highlight.
    const convertColorsToHighlight =
      !yarleOptions.preserveColorsAsHtml && yarleOptions.convertColorsToMDHighlight;

    const isEvernoteHighlight =
      nodeValue.includes(EVERNOTE_HIGHLIGHT) || nodeValue.includes(EVERNOTE_COLORHIGHLIGHT);

    const match = nodeValue.match(
      /color:rgb\(\d{0,3}, \d{0,3}, \d{0,3}\);|background-color: #([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|--en-fontfamily:[^"]*/
    );

    const shouldHighlight = isEvernoteHighlight || (convertColorsToHighlight && match);

    return shouldHighlight
      ? `${languageItems.highlight}${content}${languageItems.highlight}`
      : content;
  },
};
