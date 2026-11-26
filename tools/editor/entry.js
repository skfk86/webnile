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
import {highlightSelectionMatches, searchKeymap, openSearchPanel} from '@codemirror/search';
import {html} from '@codemirror/lang-html';
import {javascript, localCompletionSource} from '@codemirror/lang-javascript';
import {css} from '@codemirror/lang-css';
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

// يستعمل اقتراحات التطبيق أولاً، ثم اقتراحات اللغة (كل وسوم HTML وخصائص CSS ومتغيراتك في JS)
function combined(smart, lang) {
  return async ctx => {
    const r = smart(ctx);
    if (r) return r;
    const srcs = [...ctx.state.languageDataAt('autocomplete', ctx.pos)];
    if (lang === 'js') srcs.unshift(localCompletionSource);
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
    if (!options.length || (from === ctx.pos && !ctx.explicit && lang === 'js')) return null;
    return {from, options: options.slice(0, 40), filter: false};
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

function load(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

function langExt(lang) {
  if (lang === 'js') return javascript();
  if (lang === 'css') return css();
  return [closeRawTags, html({autoCloseTags: true, matchClosingTags: true})];
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

  const acKeys = touch
    // على الجوال: Enter يبقى سطراً جديداً دائماً، والاقتراح يُختار من الشريط أو بزر Tab
    ? [{key: 'Tab', run: acceptCompletion}, {key: 'Escape', run: closeCompletion}]
    : [{key: 'Ctrl-Space', run: startCompletion}, {key: 'Escape', run: closeCompletion},
       {key: 'ArrowDown', run: moveCompletionSelection(true)}, {key: 'ArrowUp', run: moveCompletionSelection(false)},
       {key: 'PageDown', run: moveCompletionSelection(true, 'page')}, {key: 'PageUp', run: moveCompletionSelection(false, 'page')},
       {key: 'Enter', run: acceptCompletion}, {key: 'Tab', run: acceptCompletion}];

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
      autocompletion({override: [combined(smartSource(f.complete), f.lang)], defaultKeymap: false, icons: false,
        activateOnTypingDelay: 40, maxRenderedOptions: 40, closeOnBlur: !touch}),
      keymap.of([...acKeys, ...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap,
        {key: 'Tab', run: indentMore, shift: indentLess}]),
      langExt(f.lang),
      theme, wrapC.of(wrapOn ? EditorView.lineWrapping : []),
      EditorView.contentAttributes.of({dir: 'ltr', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'محرر الكود'}),
      EditorView.updateListener.of(u => {
        if (u.docChanged && !u.transactions.some(tr => tr.annotation(External))) listeners.forEach(fn => fn(cur));
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
    open(key) {
      if (!byKey[key] || key === cur) return;
      states[cur] = view.state;
      view.setState(states[key] || mkState(byKey[key]));
      view.dispatch({effects: wrapC.reconfigure(wrapOn ? EditorView.lineWrapping : [])});
      cur = key;
      if (o.onCompletions) o.onCompletions([]);
      if (o.onCursor) o.onCursor(cursorInfo(view.state));
    },
    onInput(f) { listeners.push(f); },
    focus() { view.focus(); },
    type(text) { typeText(view, text); view.focus(); },
    tab() { if (completionStatus(view.state) === 'active') acceptCompletion(view); else indentMore(view); view.focus(); },
    undo() { undo(view); view.focus(); },
    redo() { redo(view); view.focus(); },
    left() { cursorCharLeft(view); view.focus(); },
    right() { cursorCharRight(view); view.focus(); },
    up() { cursorLineUp(view); view.focus(); },
    down() { cursorLineDown(view); view.focus(); },
    enter() { insertNewlineAndIndent(view); view.focus(); },
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
      view.focus();
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
