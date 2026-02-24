// src/utils/turndown-rules/indent-rule.ts

import { yarleOptions } from '../../yarle';

import { filterByNodeName } from './filter-by-nodename';
import { getAttributeProxy } from './get-attribute-proxy'; 
import { parseInlineStyle } from './parse-inline-style';

function getMarginLeftPx(css: Record<string, string>): number {
  const raw = css['margin-left'];
  if (!raw) return 0;
  const m = raw.match(/(-?\d+(?:\.\d+)?)px/i);
  if (!m) return 0;
  return Math.max(0, Math.floor(parseFloat(m[1])));
}

function wrapWithNestedUl(content: string, levels: number): string {
  let out = content;
  for (let i = 0; i < levels; i++) {
    if (yarleOptions.preserveIndentAsHtml == 1) { 
      out = `<ul>${out}></ul>`;
    } else {
      out = `<ul><li>${out}</li></ul>`;
    }
  }
  return out;
}

export const indentRule = {
  filter: (node: HTMLElement) => {
    if (!yarleOptions.preserveIndentAsHtml) return false;
    const tag = node.nodeName.toLowerCase();
    return tag === 'div' || tag === 'p';
  }, // Would have used filter-by-nodename but need two tags here...
  replacement: (content: string, node: any) => {
    if (!yarleOptions.preserveIndentAsHtml) return content;

    const nodeProxy = getAttributeProxy(node);
    const styleAttr: string = nodeProxy.style?.value ?? '';
    if (!styleAttr) return content;

    const css = parseInlineStyle(styleAttr);
    const levels = Math.floor(getMarginLeftPx(css) / 40);
    if (levels <= 0) return content;

    // Optional safety: don't indent inside existing lists
    if (node.parentNode?.nodeName?.toLowerCase() === 'li') return content;

    return wrapWithNestedUl(content, levels);
  },
};