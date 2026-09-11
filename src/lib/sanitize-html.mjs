import { parseFragment, serialize } from 'parse5';

const ALLOWED_TAGS = new Set([
  'a', 'blockquote', 'br', 'code', 'em', 'h2', 'h3', 'h4',
  'li', 'ol', 'p', 'pre', 'strong', 'ul', 'img',
]);
const DROP_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button']);
const ALLOWED_ATTRS = new Set(['alt', 'height', 'href', 'src', 'title', 'width']);

function safeUrl(value, { image = false } = {}) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || (!image && /^mailto:/i.test(raw)) || raw.startsWith('/')) return raw;
  return null;
}

function sanitizeChildren(node) {
  const children = [];
  for (const child of node.childNodes || []) {
    if (child.nodeName === '#text') {
      children.push(child);
      continue;
    }
    if (child.nodeName === '#comment' || DROP_TAGS.has(child.nodeName)) continue;
    if (!ALLOWED_TAGS.has(child.nodeName)) {
      children.push(...sanitizeChildren(child));
      continue;
    }
    child.attrs = (child.attrs || []).filter((attr) => {
      if (!ALLOWED_ATTRS.has(attr.name)) return false;
      if (attr.name === 'href' || attr.name === 'src') {
        attr.value = safeUrl(attr.value, { image: attr.name === 'src' });
        return Boolean(attr.value);
      }
      return true;
    });
    child.childNodes = sanitizeChildren(child);
    children.push(child);
  }
  return children;
}

export function sanitizeBlogHtml(raw = '') {
  const fragment = parseFragment(String(raw));
  fragment.childNodes = sanitizeChildren(fragment);
  return serialize(fragment);
}
