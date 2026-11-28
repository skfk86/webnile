// Emmet مصغّر لـ HTML: يحوّل اختصاراً بنيوياً إلى وسوم كاملة بقالب CodeMirror (مواضع Tab).
// المدعوم: tag#id.class[attr=v]{نص}  >  +  ^  *N  $ (ترقيم)  ( )  .class وحده = div.class
// أمثلة: ul>li*3   nav>a.link*4{رابط $}   .card>h2+p   form>(label+input)*2+button{إرسال}

const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'wbr']);
const DEFAULT_ATTRS = {a: [['href', '']], img: [['src', ''], ['alt', '']], input: [['type', 'text']], label: [['for', '']],
  link: [['rel', 'stylesheet'], ['href', '']], script: [['src', '']], iframe: [['src', '']]};
const INLINE = new Set(['a', 'span', 'b', 'i', 'strong', 'em', 'small', 'label', 'img', 'input', 'button', 'code', 'br', 'option', 'td', 'th', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'title']);
// يستخرج الاختصار قبل المؤشر: نرجع للخلف حتى مسافة أو بداية السطر أو نهاية وسم HTML،
// مع تخطي ما بين { } و [ ] (قد يحويان مسافات).
function extract(before) {
  const tags = [...before.matchAll(/<[^<>]*>/g)];
  const base = tags.length ? tags[tags.length - 1].index + tags[tags.length - 1][0].length : 0;
  let i = before.length;
  while (i > base) {
    const c = before[i - 1];
    if (c === '}' || c === ']') {
      const o = before.lastIndexOf(c === '}' ? '{' : '[', i - 2);
      if (o < base) return null;
      i = o; continue;
    }
    if (/[\w.#\-$>+*^()=@!:]/.test(c)) { i--; continue; }
    break;
  }
  return before.slice(i);
}

// صيغة بمسافات حول المعاملات (h1 + p): تُقبل فقط إن كانت وحدها في السطر وكل طرف وسم معروف أو .class/#id،
// كي لا يتحول نص عادي مثل "Salt + pepper" إلى وسوم.
const KNOWN = /^(?:[.#]|(?:div|p|a|span|ul|ol|li|h[1-6]|nav|header|footer|main|section|article|aside|form|label|input|button|img|table|thead|tbody|tr|td|th|select|option|textarea|figure|figcaption|video|audio|source|iframe|strong|em|small|b|i)(?![\w-]))/;
function spaced(before) {
  const seg = before.replace(/^.*<[^<>]*>/, '');
  const m = /^\s*(\S.*?)$/.exec(seg);
  if (!m || !/\s[>+^]|[>+^]\s/.test(m[1])) return null;
  const abbr = m[1].replace(/(\{[^{}]*\}|\[[^\]]*\])|\s*([>+^])\s*/g, (x, keep, op) => keep || op);
  const bare = abbr.replace(/\{[^{}]*\}|\[[^\]]*\]/g, '');
  if (/\s/.test(bare) || !bare.split(/[>+^]+/).every(t => KNOWN.test(t.replace(/^\(+/, '')))) return null;
  return {abbr, length: m[1].length};
}

function parse(src) {
  let i = 0;
  const peek = () => src[i], eat = c => (src[i] === c ? (i++, true) : false);
  const num = () => { const m = /^\d+/.exec(src.slice(i)); if (!m) return null; i += m[0].length; return +m[0]; };
  function element() {
    if (eat('(')) {
      const g = sequence();
      if (!eat(')')) throw 0;
      const n = eat('*') ? num() : 1;
      return {group: g, n: n || 1};
    }
    const el = {tag: '', id: '', cls: [], attrs: [], text: null, n: 1, kids: []};
    const m = /^[a-zA-Z][\w-]*/.exec(src.slice(i));
    if (m) { el.tag = m[0].toLowerCase(); i += m[0].length; }
    for (;;) {
      if (eat('#')) { const x = /^[\w$-]+/.exec(src.slice(i)); if (!x) throw 0; el.id = x[0]; i += x[0].length; }
      else if (eat('.')) { const x = /^[\w$-]+/.exec(src.slice(i)); if (!x) throw 0; el.cls.push(x[0]); i += x[0].length; }
      else if (eat('[')) {
        const end = src.indexOf(']', i); if (end < 0) throw 0;
        for (const a of src.slice(i, end).match(/[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s\]]*))?/g) || []) {
          const [k, ...v] = a.split('='); el.attrs.push([k, v.join('=').replace(/^["']|["']$/g, '')]);
        }
        i = end + 1;
      } else if (eat('{')) { const end = src.indexOf('}', i); if (end < 0) throw 0; el.text = src.slice(i, end); i = end + 1; }
      else break;
    }
    if (!el.tag && !el.id && !el.cls.length && !el.attrs.length && el.text == null) throw 0;
    if (!el.tag) el.tag = 'div';
    if (eat('*')) el.n = num() || 1;
    if (el.text == null && eat('{')) { const end = src.indexOf('}', i); if (end < 0) throw 0; el.text = src.slice(i, end); i = end + 1; }
    return el;
  }
  // تسلسل: عناصر يفصلها + أو > أو ^
  function sequence() {
    const root = [];
    const parents = [root];
    let last = null;
    for (;;) {
      const el = element();
      parents[parents.length - 1].push(el);
      last = el;
      const c = peek();
      if (c === '>') { i++; if (!last.kids) throw 0; parents.push(last.kids); }
      else if (c === '+') i++;
      else if (c === '^') { while (eat('^')) if (parents.length > 1) parents.pop(); }
      else break;
    }
    return root;
  }
  const r = sequence();
  if (i !== src.length) throw 0;
  return r;
}

// يحوّل الشجرة إلى قالب CodeMirror snippet (${} مواضع فارغة)، بإزاحة \t لكل مستوى
function render(nodes, depth, idx) {
  let out = [];
  for (const nd of nodes) {
    for (let k = 1; k <= nd.n; k++) {
      const num = s => s.replace(/\$+/g, d => String(k).padStart(d.length, '0'));
      if (nd.group) { out.push(...render(nd.group, depth, k)); continue; }
      const tag = nd.tag, attrs = [];
      if (nd.id) attrs.push(`id="${num(nd.id)}"`);
      if (nd.cls.length) attrs.push(`class="${nd.cls.map(num).join(' ')}"`);
      const given = new Set(nd.attrs.map(a => a[0]));
      for (const [a, v] of [...(DEFAULT_ATTRS[tag] || []).filter(a => !given.has(a[0])), ...nd.attrs]) attrs.push(`${a}="${v ? num(v) : '${}'}"`);
      const open = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
      const pad = '\t'.repeat(depth);
      if (VOID.has(tag)) { out.push(pad + open); continue; }
      const text = nd.text != null ? num(nd.text).replace(/[{}]/g, '') : '';
      if (nd.kids.length) {
        out.push(pad + open, ...render(nd.kids, depth + 1, k), pad + `</${tag}>`);
      } else {
        out.push(pad + open + (text || '${}') + `</${tag}>`);
      }
    }
  }
  return out;
}

// يرجع {from, template} أو null إن لم يكن ما قبل المؤشر اختصار Emmet صالحاً
export function emmetAt(state, pos) {
  const line = state.doc.lineAt(pos), before = state.sliceDoc(line.from, pos);
  const sp = spaced(before);
  const abbr = sp ? sp.abbr : extract(before);
  if (!abbr) return null;
  if (!/[.#>+*^([{]/.test(abbr) || /^\.?\d/.test(abbr) || abbr.length > 200) return null;
  let tree;
  try { tree = parse(abbr); } catch (e) { return null; }
  let lines = render(tree, 0, 1);
  if (!lines.length || lines.length > 300) return null;
  const tpl = lines.join('\n');
  // أول موضع فارغ يصبح ${1} والبقية مواضع تالية، والأخير ${0}
  let n = 0;
  const template = tpl.replace(/\$\{\}/g, () => '${' + (++n) + '}');
  const inline = lines.length === 1 && INLINE.has((tree[0] && tree[0].tag) || '');
  return {from: pos - (sp ? sp.length : abbr.length), abbr, template, preview: tpl.replace(/\$\{\}/g, '').replace(/\t/g, '  '), inline};
}
