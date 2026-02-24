export function parseInlineStyle(styleAttr: string): Record<string, string> {
  const css: Record<string, string> = {};

  styleAttr
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(pair => {
      const idx = pair.indexOf(':');
      if (idx === -1) return;

      const prop = pair.slice(0, idx).trim().toLowerCase();
      const val  = pair.slice(idx + 1).trim();

      if (prop) css[prop] = val;
    });

  return css;
}
