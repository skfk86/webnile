// محرر ويب نايل: CodeMirror 6 مع تلوين، إكمال تلقائي، إغلاق تلقائي للأقواس والوسوم،
// وشريط مفاتيح ورموز مخصص للجوال. يُبنى إلى src/vendor/codemirror.js (npm run build).
import {EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  drawSelection, highlightSpecialChars, dropCursor} from '@codemirror/view';
import {EditorState, Compartment, Annotation} from '@codemirror/state';
import {defaultKeymap, history, historyKeymap, undo, redo, indentMore, indentLess,
  cursorCharLeft, cursorCharRight, cursorLineUp, cursorLineDown, insertNewlineAndIndent, indentSelection} from '@codemirror/commands';
import {indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit} from '@codemirror/language';
import {autocompletion, closeBrackets, closeBracketsKeymap, insertBracket, startCompletion, closeCompletion,
  acceptCompletion, moveCompletionSelection, currentCompletions, selectedCompletionIndex,
  setSelectedCompletion, completionStatus} from '@codemirror/autocomplete';
import {highlightSelectionMatches, searchKeymap, openSearchPanel, gotoLine, selectNextOccurrence} from '@codemirror/search';
import {nextSnippetField, hasNextSnippetField} from '@codemirror/autocomplete';
import {linter, lintGutter, openLintPanel, nextDiagnostic, forEachDiagnostic, setDiagnosticsEffect} from '@codemirror/lint';
import {syntaxTree} from '@codemirror/language';
import {buildIndex, projectCompletions, JS_MEMBERS, JS_ANY} from './project.js';
import {emmetAt} from './emmet.js';
import {snippetOptions, expandAt as expandSnippet, apply as applySnippet} from './snippets.js';
import {lintSource} from './lint.js';
import {html} from '@codemirror/lang-html';
import {javascript, localCompletionSource} from '@codemirror/lang-javascript';
import {css} from '@codemirror/lang-css';
import {json, jsonParseLinter} from '@codemirror/lang-json';
import {markdown} from '@codemirror/lang-markdown';
import {tags as t} from '@lezer/highlight';

const External = Annotation.define();
const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// ثيم داكن احترافي مستوحى من One Dark / VS Code
const P = {bg: '#1E222A', gut: '#1E222A', fg: '#ABB2BF', line: '#262B34', sel: 'rgba(97,175,239,.28)', caret: '#F5B83D',
  num: '#4B5263', numOn: '#ABB2BF', tip: '#252A33', accent: '#12B5A6'};
const hl = HighlightStyle.define([
  {tag: [t.comment, t.lineComment, t.blockComment], color: '#7F848E', fontStyle: 'italic'},
  {tag: [t.tagName], color: '#E06C75'},
  {tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.definitionKeyword, t.operatorKeyword, t.modifier, t.self], color: '#C678DD'},
  {tag: [t.attributeName], color: '#D19A66'},
  {tag: [t.propertyName], color: '#56B6C2'},
  {tag: [t.string, t.attributeValue, t.special(t.string), t.regexp], color: '#98C379'},
  {tag: [t.number, t.bool, t.null, t.atom, t.unit, t.color, t.integer, t.float], color: '#D19A66'},
  {tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#61AFEF'},
  {tag: [t.className, t.typeName, t.labelName, t.namespace], color: '#E5C07B'},
  {tag: [t.definition(t.variableName), t.variableName], color: '#E06C75'},
  {tag: [t.definition(t.propertyName)], color: '#E06C75'},
  {tag: [t.angleBracket], color: '#7F848E'},
  {tag: [t.bracket, t.punctuation, t.separator], color: '#ABB2BF'},
  {tag: [t.operator, t.derefOperator], color: '#56B6C2'},
  {tag: [t.processingInstruction, t.documentMeta, t.meta], color: '#C678DD'},
  {tag: t.invalid, color: '#FF6B6B'},
]);

const theme = EditorView.theme({
  '&': {color: P.fg, backgroundColor: P.bg, height: '100%', fontSize: 'var(--wn-fs, 15px)'},
  '&.cm-focused': {outline: 'none'},
  '.cm-scroller': {fontFamily: 'var(--mono, monospace)', lineHeight: '1.65', overscrollBehavior: 'contain'},
  '.cm-content': {caretColor: P.caret, padding: '8px 0 48px'},
  '.cm-line': {padding: '0 14px 0 8px'},
  '.cm-cursor, .cm-dropCursor': {borderLeftColor: P.caret, borderLeftWidth: '2px'},
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {backgroundColor: P.sel},
  '.cm-activeLine': {backgroundColor: P.line},
  '.cm-gutters': {backgroundColor: P.gut, color: P.num, border: 'none', borderRight: '1px solid #2A2F38'},
  '.cm-activeLineGutter': {backgroundColor: P.line, color: P.numOn},
  '.cm-lineNumbers .cm-gutterElement': {padding: '0 8px 0 10px', minWidth: '30px'},
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {backgroundColor: 'rgba(97,175,239,.18)', outline: '1px solid rgba(97,175,239,.55)', color: 'inherit'},
  '.cm-nonmatchingBracket': {backgroundColor: 'rgba(224,108,117,.35)'},
  '.cm-selectionMatch': {backgroundColor: 'rgba(229,192,123,.16)'},
  '.cm-searchMatch': {backgroundColor: 'rgba(229,192,123,.3)', outline: '1px solid #E5C07B'},
  '.cm-tooltip': {border: '1px solid #333943', backgroundColor: P.tip, color: P.fg, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 28px rgba(0,0,0,.5)'},
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {fontFamily: 'var(--mono, monospace)', maxHeight: '14em'},
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {padding: '4px 12px', lineHeight: '1.55'},
  '.cm-tooltip-autocomplete ul li[aria-selected]': {backgroundColor: '#2C5D8F', color: '#fff'},
  '.cm-completionDetail': {color: '#7F848E', fontStyle: 'normal', marginInlineStart: '10px'},
  '.cm-panels': {backgroundColor: '#181A1F', color: P.fg},
  '.cm-panels input, .cm-panels button': {fontFamily: 'inherit'},
  '.cm-panels.cm-panels-bottom': {borderTop: '1px solid #2A2F38'},
  '.cm-textfield': {backgroundColor: '#14161B', color: P.fg, border: '1px solid #3A3F4A', borderRadius: '6px', padding: '4px 6px', fontSize: '14px'},
  '.cm-button': {backgroundImage: 'none', backgroundColor: '#2A2D35', color: P.fg, border: '1px solid #3A3F4A', borderRadius: '6px', padding: '3px 10px'},
  '.cm-panel.cm-search label': {fontSize: '12px', color: '#9AA0A6'},
  '.cm-panel.cm-panel-lint ul': {maxHeight: '30vh'},
  '.cm-panel.cm-panel-lint ul [aria-selected]': {backgroundColor: '#2C5D8F'},
  '.cm-panel.cm-panel-lint ul [aria-selected] .cm-diagnosticText': {color: '#fff'},
  '.cm-diagnostic': {padding: '6px 10px', fontFamily: 'Cairo, system-ui, sans-serif', fontSize: '13px', direction: 'rtl', textAlign: 'right'},
  '.cm-diagnostic-error': {borderLeft: 'none', borderRight: '4px solid #E06C75'},
  '.cm-diagnostic-warning': {borderLeft: 'none', borderRight: '4px solid #E5C07B'},
  '.cm-diagnostic-info': {borderLeft: 'none', borderRight: '4px solid #61AFEF'},
  '.cm-tooltip-lint': {maxWidth: '86vw'},
  '.cm-gutter-lint': {width: '12px'},
  '.cm-gutter-lint .cm-gutterElement': {padding: '0 1px'},
  '.cm-sn-info': {margin: '0', padding: '6px 10px', fontFamily: 'var(--mono, monospace)', fontSize: '12px', whiteSpace: 'pre', color: '#C9CDD4', maxWidth: '80vw', overflow: 'hidden'},
  '.cm-sn-info b': {display: 'block', fontFamily: 'Cairo, system-ui, sans-serif', fontWeight: '600', color: '#E6E6E6', whiteSpace: 'normal', marginBottom: '4px'},
  '.cm-sn-info pre': {margin: 0, font: 'inherit'},
  '.cm-snippetField': {backgroundColor: 'rgba(97,175,239,.16)', borderRadius: '2px'},
  '.cm-completionInfo': {backgroundColor: P.tip, border: '1px solid #333943', borderRadius: '8px', padding: '6px 10px', fontFamily: 'Cairo, system-ui, sans-serif', fontSize: '12.5px', maxWidth: '70vw'},
}, {dark: true});

// يحوّل اقتراحات التطبيق الذكية {l,x,f,g,t} (حيث | مكان المؤشر) إلى اقتراحات CodeMirror
const TYPE = {t: 'type', a: 'property', s: 'text', v: 'constant', p: 'property'};
const DETAIL = {t: 'وسم', a: 'خاصية', s: 'قيمة', v: 'قيمة', p: 'خاصية'};
function smartSource(fn) {
  return ctx => {
    if (typeof fn !== 'function') return null;
    const st = ctx.state, pos = ctx.pos;
    const before = st.sliceDoc(0, pos), after = st.sliceDoc(pos, Math.min(st.doc.length, pos + 4));
    let items;
    try { items = fn(before, after) || []; } catch (e) { items = []; }
    if (!items.length) return null;
    const f = items[0].f || 0, g = items[0].g || 0;
    return {
      from: pos - f, to: pos + g, filter: false,
      options: items.map((x, i) => ({
        label: x.l, type: TYPE[x.t] || 'text', detail: DETAIL[x.t], boost: 99 - i,
        apply: (view, c, from, to) => {
          const text = x.x.replace('|', ''), k = x.x.indexOf('|');
          const s = pos - (x.f || 0), e = pos + (x.g || 0);
          view.dispatch({changes: {from: s, to: e, insert: text},
            selection: {anchor: s + (k < 0 ? text.length : k)}, userEvent: 'input.complete', scrollIntoView: true});
          // اقترح التالي مباشرة (مثل قيم CSS بعد اختيار الخاصية)
          setTimeout(() => startCompletion(view), 0);
        },
      })),
    };
  };
}

// شرح مختصر لاقتراحات JavaScript (يظهر بجانب الاقتراح)
const JS_INFO = {};
for (const k of Object.keys(JS_MEMBERS)) for (const m of JS_MEMBERS[k]) JS_INFO[k + '.' + m.label] = m;
for (const m of JS_ANY) if (!JS_INFO['.' + m.label]) JS_INFO['.' + m.label] = m;
function jsInfo(before, label) {
  const name = label.replace(/\(.*$/, '').replace(/^\./, '');
  const m = /\b([A-Za-z_$][\w$]*)\.[\w$]*$/.exec(before);
  return (m && JS_INFO[m[1] + '.' + name]) || JS_INFO['.' + name] || null;
}
// أعضاء كائنات لا تغطيها اقتراحات التطبيق (Object. Array. Number. window. …)
function memberSource(ctx) {
  const before = ctx.state.sliceDoc(Math.max(0, ctx.pos - 80), ctx.pos);
  const m = /\b(Object|Array|Number|window|JSON|Math|localStorage|document|console)\.([\w$]*)$/.exec(before);
  if (!m || !JS_MEMBERS[m[1]]) return null;
  return {from: ctx.pos - m[2].length, validFor: /^[\w$]*$/, options: JS_MEMBERS[m[1]].map(x => ({
    label: x.label, detail: x.detail, info: x.info, type: x.type,
    apply: x.detail && x.detail[0] === '(' ? (view, c, from, to) => {
      const ins = x.label + '()';
      view.dispatch({changes: {from, to, insert: ins}, selection: {anchor: from + ins.length - (x.detail === '()' ? 0 : 1)}, userEvent: 'input.complete'});
    } : x.label,
  }))};
}

// اللغة عند المؤشر (لملفات HTML التي فيها <style> و<script>)
export function langAt(state, pos, fileLang) {
  if (fileLang !== 'html') return fileLang;
  let n = syntaxTree(state).resolveInner(pos, -1);
  for (; n; n = n.parent) {
    const t = n.type.name;
    if (t === 'StyleSheet' || t === 'StyleText') return 'css';
    if (t === 'Script' || t === 'ScriptText') return 'js';
    if (t === 'Document' || t === 'Element') return 'html';
  }
  return 'html';
}

// ترتيب المصادر: سياق المشروع ← اقتراحات التطبيق ← أعضاء JS ← اقتراحات اللغة. ثم Emmet والقوالب تُضاف عند مطابقتها.
function combined(smart, lang, env) {
  return async ctx => {
    const L = langAt(ctx.state, ctx.pos, lang);
    let r = projectCompletions(ctx, L === 'css' && lang === 'html' ? 'html' : L, env.index);
    if (r) { const typed = ctx.state.sliceDoc(r.from, ctx.pos); r.options = r.options.filter(o => o.label !== typed); if (!r.options.length) r = null; }
    r = r || smart(ctx);
    if (r && L === 'js') {
      const before = ctx.state.sliceDoc(Math.max(0, ctx.pos - 80), ctx.pos);
      r.options = r.options.map(o => { const d = jsInfo(before, o.label); return d && !o.info ? {...o, info: d.info, detail: o.detail || d.detail} : o; });
    }
    if (!r && L === 'js') r = memberSource(ctx);
    if (!r) {
      const srcs = [...ctx.state.languageDataAt('autocomplete', ctx.pos)];
      if (L === 'js') srcs.unshift(localCompletionSource);
      let from = null, seen = new Set(), options = [];
      for (const s of srcs) {
        if (typeof s !== 'function') continue;
        let res;
        try { res = await s(ctx); } catch (e) { res = null; }
        if (!res || !res.options || !res.options.length) continue;
        if (from === null) from = res.from; else if (res.from !== from) continue;
        const typed = ctx.state.sliceDoc(from, ctx.pos).toLowerCase();
        for (const o of res.options) {
          const l = o.label.toLowerCase();
          if (seen.has(o.label) || (typed && (!l.startsWith(typed) || l === typed))) continue;
          seen.add(o.label); options.push(o);
        }
      }
      if (options.length && !(from === ctx.pos && !ctx.explicit && L === 'js')) r = {from, options: options.slice(0, 40), filter: false};
    }
    // Emmet (HTML فقط، خارج الوسوم)
    const extra = [];
    if (L === 'html') {
      const e = emmetAt(ctx.state, ctx.pos);
      if (e) extra.push({from: e.from, opt: {label: e.abbr, detail: 'Emmet', type: 'keyword', boost: 99,
        info: () => { const d = document.createElement('pre'); d.className = 'cm-sn-info'; d.textContent = e.preview; return d; },
        apply: (view, c, from, to) => applySnippet(view, {body: e.template}, from, to)}});
    }
    // القوالب: الكلمة قبل المؤشر جزء من اختصار قالب
    // تُقترح القوالب فقط إن كانت الكلمة أول ما في السطر (لا داخل نص أو قيمة أو خاصية)
    const lineBefore = ctx.state.sliceDoc(ctx.state.doc.lineAt(ctx.pos).from, ctx.pos);
    const wm = /^\s*([!\w-]+)$/.exec(lineBefore);
    if (wm && env.snippets) {
      const list = env.snippets(L) || [];
      for (const o of snippetOptions(list, wm[1])) extra.push({from: ctx.pos - wm[1].length, opt: o});
    }
    for (const x of extra) {
      if (!r) r = {from: x.from, options: [], filter: false};
      if (r.from === x.from) r.options = x.opt.detail === 'Emmet' ? [x.opt, ...r.options] : [...r.options, x.opt];
    }
    if (r && r.options && !r.options.length) return null;
    return r;
  };
}

// إغلاق <style> و<script> تلقائياً (لا يغطيه autoCloseTags في CodeMirror)
const closeRawTags = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== '>' || from !== to) return false;
  const line = view.state.doc.lineAt(from), before = line.text.slice(0, from - line.from);
  const m = before.match(/<(style|script)(\s[^<>]*)?$/i);
  if (!m) return false;
  const name = m[1].toLowerCase(), rest = view.state.sliceDoc(from, from + 200).toLowerCase();
  if (rest.trimStart().startsWith('</' + name)) return false;
  const ind = (line.text.match(/^\s*/) || [''])[0];
  const ins = '>\n' + ind + '  \n' + ind + '</' + name + '>';
  view.dispatch({changes: {from, insert: ins}, selection: {anchor: from + 2 + ind.length + 2}, userEvent: 'input.type', scrollIntoView: true});
  return true;
});

// يُدخل نصاً كأن المستخدم كتبه، فيعمل إغلاق الأقواس والوسوم التلقائي مع أزرار الشريط أيضاً
function typeText(view, text) {
  const {from, to} = view.state.selection.main;
  if (text.length === 1) {
    for (const h of view.state.facet(EditorView.inputHandler)) {
      try { if (h(view, from, to, text, () => view.state.update(view.state.replaceSelection(text), {userEvent: 'input.type'}))) return; } catch (e) {}
    }
    const tr = insertBracket(view.state, text);
    if (tr) { view.dispatch(tr); return; }
  }
  view.dispatch(view.state.replaceSelection(text), {userEvent: 'input.type', scrollIntoView: true});
}

// الإدراج السريع لوسم HTML من الشريط: يستبدل بداية وسم ناقصة قبل المؤشر ("<h" أو "<h1" أو "di")،
// ويحيط النص المحدد بالوسم، ويضع المؤشر داخل الوسمين. كل ذلك في معاملة واحدة (تراجع واحد).
const ATTR_TAGS = {a: ' href="#"'};
const VOID_TAGS = {img: ['<img src="', '" alt="', '">'], input: ['<input type="text" placeholder="', '', '">'],
  br: ['<br>', '', ''], hr: ['<hr>', '', ''], meta: ['<meta name="', '" content="', '">'], link: ['<link rel="stylesheet" href="', '', '">']};
export function tagEdit(state, name) {
  name = String(name).toLowerCase();
  const r = state.selection.main;
  let from = r.from, to = r.to;
  const sel = state.sliceDoc(r.from, r.to);
  if (r.empty) {
    const line = state.doc.lineAt(r.from), before = state.sliceDoc(line.from, r.from);
    const m = before.match(/<\/?([a-zA-Z][\w-]*)?$/) || before.match(/(?:^|[\s>])([a-zA-Z][\w-]*)$/);
    if (m) {
      const word = (m[1] || '').toLowerCase(), raw = m[0].replace(/^[\s>]/, '');
      if (raw.startsWith('<') || (word && name.startsWith(word))) from = r.from - raw.length;
    }
  }
  const v = VOID_TAGS[name];
  let insert, anchor, head;
  if (v) {
    if (name === 'br' || name === 'hr') { insert = sel + v[0]; anchor = head = from + insert.length; }
    else if (name === 'img') { insert = v[0] + v[1] + sel + v[2]; anchor = head = from + v[0].length; }
    else { insert = v[0] + sel + v[1] + v[2]; anchor = head = from + v[0].length + sel.length; }
  } else {
    const open = '<' + name + (ATTR_TAGS[name] || '') + '>', close = '</' + name + '>';
    insert = open + sel + close;
    anchor = from + open.length; head = anchor + sel.length;
  }
  return {changes: {from, to, insert}, selection: {anchor, head}, userEvent: 'input.type', scrollIntoView: true};
}

function load(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

function langExt(lang) {
  if (lang === 'js') return javascript();
  if (lang === 'css') return css();
  if (lang === 'json') return json();
  if (lang === 'md') return markdown();
  if (lang !== 'html') return [];
  return [closeRawTags, html({autoCloseTags: true, matchClosingTags: true})];
}

// ترجمة لوحات CodeMirror (البحث والاستبدال والانتقال لسطر والأخطاء)
const PHRASES = EditorState.phrases.of({
  'Find': 'بحث', 'Replace': 'استبدال', 'next': 'التالي', 'previous': 'السابق', 'all': 'الكل', 'match case': 'حالة الأحرف',
  'regexp': 'تعبير نمطي', 'by word': 'كلمة كاملة', 'replace': 'استبدل', 'replace all': 'استبدل الكل', 'close': 'إغلاق',
  'Go to line': 'انتقل إلى السطر', 'go': 'انتقل', 'Diagnostics': 'الأخطاء', 'No diagnostics': 'لا توجد أخطاء',
  'current match': 'المطابقة الحالية', 'on line': 'في السطر', 'replaced match on line $': 'استُبدلت المطابقة في السطر $',
  'replaced $ matches': 'استُبدلت $ مطابقات', 'Selection deleted': 'حُذف التحديد', 'Folded lines': 'أسطر مطوية', 'Unfolded lines': 'أسطر مفتوحة',
});

// الانتقال إلى التعريف: متغير/دالة JS، أو class/id بين HTML و CSS (عبر ملفات المشروع)
function findDefinition(api, files, lang, state) {
  const pos = state.selection.main.head, line = state.doc.lineAt(pos);
  const t = line.text, c = pos - line.from;
  let s = c, e = c;
  while (s > 0 && /[\w$-]/.test(t[s - 1])) s--;
  while (e < t.length && /[\w$-]/.test(t[e])) e++;
  const word = t.slice(s, e).replace(/^-+|-+$/g, '');
  if (!word) return null;
  const esc = word.replace(/[$]/g, '\\$');
  const before = t.slice(0, s), L = langAt(state, pos, lang);
  const searchIn = (langs, re) => {
    for (const f of files) {
      if (!langs.includes(f.lang)) continue;
      const text = api.get(f.key);
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const at = m.index + m[0].lastIndexOf(word);
        if (!(f.key === api.current && at <= pos && pos <= at + word.length)) return {key: f.key, name: f.name, pos: at};
      }
    }
    return null;
  };
  if (L === 'html' && /\bclass\s*=\s*["'][^"']*$/.test(before)) return searchIn(['css', 'html'], new RegExp('\\.' + esc + '(?![\\w-])[^{};]*\\{', 'g'));
  if (L === 'html' && /\bid\s*=\s*["']\s*$/.test(before)) return searchIn(['css', 'html', 'js'], new RegExp('#' + esc + '(?![\\w-])[^{};]*\\{|getElementById\\(\\s*["\'`]' + esc, 'g'));
  if (L === 'css' && /[.#]$/.test(before)) {
    const attr = before.endsWith('.') ? 'class' : 'id';
    return searchIn(['html'], new RegExp('\\b' + attr + '\\s*=\\s*["\'](?:[^"\']*\\s)?' + esc + '(?=[\\s"\'])', 'g'));
  }
  if (L === 'js' || L === 'html') return searchIn(['js', 'html'], new RegExp('(?:function\\s*\\*?\\s+|(?:const|let|var|class)\\s+)' + esc + '\\b|\\b' + esc + '\\s*(?:=\\s*(?:async\\s*)?(?:function\\b|\\([^)]*\\)\\s*=>|[\\w$]+\\s*=>)|\\([^)]*\\)\\s*\\{)', 'g'));
  return null;
}

// o.files = [{key, name, lang: 'html'|'css'|'js', doc, complete}] لعدة ملفات بتبويبات،
// أو o.lang / o.doc / o.complete لملف واحد
export function create(parent, o) {
  o = o || {};
  const files = o.files || [{key: 'main', lang: o.lang === 'js' ? 'js' : 'html', doc: o.doc || '', complete: o.complete}];
  const byKey = {};
  files.forEach(f => { byKey[f.key] = f; });
  const wrapC = new Compartment();
  let wrapOn = load('wn_ed_wrap', touch ? '1' : '0') === '1';
  let listeners = [];
  const states = {};
  let cur = files[0].key;

  // فهرس المشروع: يُعاد بناؤه فقط بعد تغيّر أحد الملفات
  let ver = 0, idx = null, idxVer = -1;
  const env = {
    index: () => {
      if (idx && idxVer === ver) return idx;
      idx = buildIndex(files.map(f => ({name: f.name, lang: f.lang, text: api.get(f.key)})));
      idxVer = ver;
      return idx;
    },
    snippets: o.snippets || null,
  };
  // Tab الذكي: موضع القالب التالي ← قبول الاقتراح ← Emmet ← اختصار قالب ← إزاحة
  const smartTab = view => {
    if (hasNextSnippetField(view.state)) return nextSnippetField(view);
    if (completionStatus(view.state) === 'active') return acceptCompletion(view);
    const r = view.state.selection.main;
    if (r.empty) {
      const L = langAt(view.state, r.head, byKey[cur].lang);
      if (L === 'html') { const e = emmetAt(view.state, r.head); if (e) { applySnippet(view, {body: e.template}, e.from, r.head); return true; } }
      if (env.snippets && expandSnippet(view, env.snippets(L) || [])) return true;
    }
    return indentMore(view);
  };
  let diag = {error: 0, warning: 0, info: 0};
  const countDiag = st => { const c = {error: 0, warning: 0, info: 0}; forEachDiagnostic(st, d => { c[d.severity] = (c[d.severity] || 0) + 1; }); return c; };

  const acKeys = touch
    // على الجوال: Enter يبقى سطراً جديداً دائماً، والاقتراح يُختار من الشريط أو بزر Tab
    ? [{key: 'Tab', run: smartTab}, {key: 'Escape', run: closeCompletion}]
    : [{key: 'Ctrl-Space', run: startCompletion}, {key: 'Escape', run: closeCompletion},
       {key: 'ArrowDown', run: moveCompletionSelection(true)}, {key: 'ArrowUp', run: moveCompletionSelection(false)},
       {key: 'PageDown', run: moveCompletionSelection(true, 'page')}, {key: 'PageUp', run: moveCompletionSelection(false, 'page')},
       {key: 'Enter', run: acceptCompletion}, {key: 'Tab', run: smartTab}];

  const cursorInfo = st => {
    const h = st.selection.main.head, l = st.doc.lineAt(h);
    return {line: l.number, col: h - l.from + 1, lines: st.doc.lines, sel: st.selection.main.to - st.selection.main.from};
  };

  const mkState = f => EditorState.create({
    doc: f.doc || '',
    extensions: [
      lineNumbers(), highlightActiveLineGutter(), highlightSpecialChars(), history(), drawSelection(), dropCursor(),
      EditorState.allowMultipleSelections.of(true), indentOnInput(), indentUnit.of('  '), EditorState.tabSize.of(2),
      syntaxHighlighting(hl), bracketMatching(), closeBrackets(), highlightActiveLine(), highlightSelectionMatches(),
      autocompletion({override: [combined(smartSource(f.complete), f.lang, env)], defaultKeymap: false, icons: false,
        activateOnTypingDelay: 40, maxRenderedOptions: 40, closeOnBlur: !touch}),
      keymap.of([...acKeys, ...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap,
        {key: 'Tab', run: indentMore, shift: indentLess}, {key: 'Mod-g', run: gotoLine}, {key: 'Mod-d', run: selectNextOccurrence}]),
      o.lint === false || !/^(html|css|js|json)$/.test(f.lang) ? [] : [linter(f.lang === 'json' ? jsonParseLinter() : lintSource(f.lang), {delay: 700}), lintGutter()],
      PHRASES,
      langExt(f.lang),
      theme, wrapC.of(wrapOn ? EditorView.lineWrapping : []),
      EditorView.contentAttributes.of({dir: 'ltr', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'محرر الكود'}),
      EditorView.updateListener.of(u => {
        if (u.docChanged) ver++;
        if (u.docChanged && !u.transactions.some(tr => tr.annotation(External))) listeners.forEach(fn => fn(cur));
        if (o.onDiagnostics && u.transactions.some(tr => tr.effects.some(e => e.is(setDiagnosticsEffect)))) { diag = countDiag(u.state); o.onDiagnostics(diag); }
        if (o.onCompletions && (u.docChanged || u.selectionSet || u.transactions.some(tr => tr.effects.length) || u.focusChanged)) o.onCompletions(api.completions());
        if (o.onCursor && (u.docChanged || u.selectionSet)) o.onCursor(cursorInfo(u.state));
      }),
    ],
  });

  const view = new EditorView({parent, state: mkState(files[0])});

  const api = {
    view,
    get current() { return cur; },
    get lang() { return byKey[cur].lang; },
    get value() { return view.state.doc.toString(); },
    // تعيين القيمة من الكود لا يطلق حدث input (مثل textarea تماماً)
    set value(v) {
      v = String(v == null ? '' : v);
      if (v === view.state.doc.toString()) return;
      view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: v}, annotations: External,
        selection: {anchor: Math.min(view.state.selection.main.head, v.length)}});
    },
    // قيمة أي ملف (التبويب الحالي أو غيره)
    get(key) {
      if (key === cur || key == null) return view.state.doc.toString();
      return states[key] ? states[key].doc.toString() : (byKey[key] ? byKey[key].doc || '' : '');
    },
    // ملفات المشروع ديناميكية: تُضاف وتُغلق وتُعاد تسميتها دون إعادة إنشاء المحرر
    get files() { return files.map(f => f.key); },
    addFile(f) { if (byKey[f.key]) return; files.push(f); byKey[f.key] = f; },
    removeFile(key) {
      if (!byKey[key] || files.length < 2) return false;
      const i = files.findIndex(x => x.key === key);
      files.splice(i, 1); delete byKey[key]; delete states[key];
      if (cur === key) { cur = null; api.open(files[Math.max(0, i - 1)].key); }
      return true;
    },
    renameFile(key, nk, name, lang) {
      const f = byKey[key]; if (!f) return;
      const text = api.get(key), sameLang = f.lang === (lang || f.lang);
      delete byKey[key]; f.key = nk; f.name = name || f.name; f.lang = lang || f.lang; f.doc = text; byKey[nk] = f;
      if (cur === key) { cur = nk; if (!sameLang) { view.setState(mkState(f)); } }
      else if (states[key]) { states[nk] = sameLang ? states[key] : null; delete states[key]; if (!states[nk]) delete states[nk]; }
      ver++;
      if (o.onCursor && cur === nk) o.onCursor(cursorInfo(view.state));
    },
    setText(key, text) {
      if (key === cur) { api.value = text; ver++; return; }
      const f = byKey[key]; if (!f) return;
      if (states[key]) states[key] = states[key].update({changes: {from: 0, to: states[key].doc.length, insert: text}, annotations: External}).state;
      else f.doc = text;
      ver++;
    },
    open(key) {
      if (!byKey[key] || key === cur) return;
      if (cur && byKey[cur]) states[cur] = view.state;
      cur = key; // قبل setState: المستمعون يقرؤون byKey[cur]
      view.setState(states[key] || mkState(byKey[key]));
      diag = countDiag(view.state); if (o.onDiagnostics) o.onDiagnostics(diag);
      view.dispatch({effects: wrapC.reconfigure(wrapOn ? EditorView.lineWrapping : [])});
      if (o.onCompletions) o.onCompletions([]);
      if (o.onCursor) o.onCursor(cursorInfo(view.state));
    },
    onInput(f) { listeners.push(f); },
    // أوامر الشريط لا تستدعي focus: لو كانت لوحة المفاتيح مغلقة تبقى مغلقة، ولو كانت مفتوحة
    // فالتطبيق يعيد التركيز فقط إن سُرق (انظر keepFocus في index.html). بذلك لا تقفز لوحة المفاتيح.
    get hasFocus() { return view.hasFocus; },
    focus() { view.focus(); },
    type(text) { typeText(view, text); },
    tag(name) { view.dispatch(tagEdit(view.state, name)); },
    tab() { smartTab(view); },
    gotoLine() { view.focus(); gotoLine(view); },
    selectNext() { selectNextOccurrence(view); },
    problems() { openLintPanel(view); },
    nextProblem() { nextDiagnostic(view); },
    get diagnostics() { return diag; },
    insertSnippet(sn) { const r = view.state.selection.main; applySnippet(view, sn, r.from, r.to); },
    select(from, to) { view.dispatch({selection: {anchor: from, head: to == null ? from : to}, scrollIntoView: true}); },
    definition() { return findDefinition(api, files, byKey[cur].lang, view.state); },
    undo() { undo(view); },
    redo() { redo(view); },
    left() { cursorCharLeft(view); },
    right() { cursorCharRight(view); },
    up() { cursorLineUp(view); },
    down() { cursorLineDown(view); },
    enter() { insertNewlineAndIndent(view); },
    suggest() { view.focus(); startCompletion(view); },
    search() { view.focus(); openSearchPanel(view); },
    format() {
      // يعيد ضبط المسافة البادئة لكل الأسطر
      const st = view.state;
      view.dispatch({selection: {anchor: 0, head: st.doc.length}});
      indentSelection(view);
      view.dispatch({selection: {anchor: Math.min(st.selection.main.head, view.state.doc.length)}});
      listeners.forEach(fn => fn(cur));
    },
    cursor() { return cursorInfo(view.state); },
    completions() {
      if (completionStatus(view.state) !== 'active') return [];
      const sel = selectedCompletionIndex(view.state);
      return currentCompletions(view.state).map((c, i) => ({label: c.label, type: c.type, sel: i === sel}));
    },
    pick(i) {
      view.dispatch({effects: setSelectedCompletion(i)});
      acceptCompletion(view);
    },
    get wrap() { return wrapOn; },
    toggleWrap() {
      wrapOn = !wrapOn; store('wn_ed_wrap', wrapOn ? '1' : '0');
      view.dispatch({effects: wrapC.reconfigure(wrapOn ? EditorView.lineWrapping : [])});
      return wrapOn;
    },
    measure() { view.requestMeasure(); },
    destroy() { listeners = []; view.destroy(); },
  };
  return api;
}

export const isTouch = touch;
