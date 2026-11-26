// محرر ويب نايل: CodeMirror 6 مع تلوين، إكمال تلقائي، إغلاق تلقائي للأقواس والوسوم،
// وشريط مفاتيح ورموز مخصص للجوال. يُبنى إلى src/vendor/codemirror.js (npm run build).
import {EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  drawSelection, highlightSpecialChars, dropCursor} from '@codemirror/view';
import {EditorState, Compartment, Annotation} from '@codemirror/state';
import {defaultKeymap, history, historyKeymap, undo, redo, indentMore, indentLess,
  cursorCharLeft, cursorCharRight, cursorLineUp, cursorLineDown, insertNewlineAndIndent} from '@codemirror/commands';
import {indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit} from '@codemirror/language';
import {autocompletion, closeBrackets, closeBracketsKeymap, insertBracket, startCompletion, closeCompletion,
  acceptCompletion, moveCompletionSelection, currentCompletions, selectedCompletionIndex,
  setSelectedCompletion, completionStatus} from '@codemirror/autocomplete';
import {highlightSelectionMatches, searchKeymap} from '@codemirror/search';
import {html} from '@codemirror/lang-html';
import {javascript, localCompletionSource} from '@codemirror/lang-javascript';
import {tags as t} from '@lezer/highlight';

const External = Annotation.define();
const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

const hl = HighlightStyle.define([
  {tag: [t.comment, t.lineComment, t.blockComment], color: '#5E7A86', fontStyle: 'italic'},
  {tag: [t.tagName, t.keyword, t.controlKeyword, t.moduleKeyword, t.definitionKeyword, t.operatorKeyword], color: '#FF7B9C'},
  {tag: [t.attributeName, t.propertyName], color: '#F5B83D'},
  {tag: [t.string, t.attributeValue, t.special(t.string), t.regexp], color: '#86EFAC'},
  {tag: [t.number, t.bool, t.null, t.atom, t.unit, t.color], color: '#FDBA74'},
  {tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#7DD3FC'},
  {tag: [t.className, t.typeName, t.labelName], color: '#7DD3FC'},
  {tag: [t.definition(t.variableName)], color: '#E6F6F7'},
  {tag: [t.angleBracket, t.bracket, t.punctuation, t.separator], color: '#6F8C98'},
  {tag: [t.operator, t.derefOperator], color: '#C4B5FD'},
  {tag: [t.processingInstruction, t.documentMeta], color: '#C4B5FD'},
  {tag: t.invalid, color: '#FF6B6B'},
]);

const theme = EditorView.theme({
  '&': {color: '#D8EEF0', backgroundColor: '#0A1A22', height: '100%', fontSize: 'var(--wn-fs, 15px)'},
  '&.cm-focused': {outline: 'none'},
  '.cm-scroller': {fontFamily: 'var(--mono, monospace)', lineHeight: '1.6', overscrollBehavior: 'contain'},
  '.cm-content': {caretColor: '#F5B83D', padding: '10px 0 40px'},
  '.cm-line': {padding: '0 12px 0 6px'},
  '.cm-cursor, .cm-dropCursor': {borderLeftColor: '#F5B83D', borderLeftWidth: '2px'},
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    {backgroundColor: 'rgba(18,181,166,.32)'},
  '.cm-activeLine': {backgroundColor: 'rgba(255,255,255,.035)'},
  '.cm-gutters': {backgroundColor: '#08171E', color: '#3E5966', border: 'none'},
  '.cm-activeLineGutter': {backgroundColor: 'transparent', color: '#9DB8C0'},
  '.cm-lineNumbers .cm-gutterElement': {padding: '0 6px 0 10px', minWidth: '28px'},
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {backgroundColor: 'rgba(245,184,61,.22)', outline: '1px solid rgba(245,184,61,.5)', color: 'inherit'},
  '.cm-nonmatchingBracket': {backgroundColor: 'rgba(214,69,69,.35)'},
  '.cm-selectionMatch': {backgroundColor: 'rgba(125,211,252,.14)'},
  '.cm-tooltip': {border: 'none', backgroundColor: '#102630', color: '#D8EEF0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.45)'},
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {fontFamily: 'var(--mono, monospace)', maxHeight: '13em'},
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {padding: '4px 10px', lineHeight: '1.5'},
  '.cm-tooltip-autocomplete ul li[aria-selected]': {backgroundColor: '#0E7C86', color: '#fff'},
  '.cm-completionDetail': {color: '#8FA8B2', fontStyle: 'normal', marginInlineStart: '8px'},
  '.cm-panels': {backgroundColor: '#07141A', color: '#D8EEF0'},
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

export function create(parent, o) {
  o = o || {};
  const lang = o.lang === 'js' ? 'js' : 'html';
  const wrapC = new Compartment();
  let wrapOn = load('wn_ed_wrap', touch ? '1' : '0') === '1';
  let listeners = [];

  const acKeys = touch
    // على الجوال: Enter يبقى سطراً جديداً دائماً، والاقتراح يُختار من الشريط أو بزر Tab
    ? [{key: 'Tab', run: acceptCompletion}, {key: 'Escape', run: closeCompletion}]
    : [{key: 'Ctrl-Space', run: startCompletion}, {key: 'Escape', run: closeCompletion},
       {key: 'ArrowDown', run: moveCompletionSelection(true)}, {key: 'ArrowUp', run: moveCompletionSelection(false)},
       {key: 'PageDown', run: moveCompletionSelection(true, 'page')}, {key: 'PageUp', run: moveCompletionSelection(false, 'page')},
       {key: 'Enter', run: acceptCompletion}, {key: 'Tab', run: acceptCompletion}];

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: o.doc || '',
      extensions: [
        lineNumbers(), highlightActiveLineGutter(), highlightSpecialChars(), history(), drawSelection(), dropCursor(),
        EditorState.allowMultipleSelections.of(true), indentOnInput(), indentUnit.of('  '), EditorState.tabSize.of(2),
        syntaxHighlighting(hl), bracketMatching(), closeBrackets(), highlightActiveLine(), highlightSelectionMatches(),
        autocompletion({override: [combined(smartSource(o.complete), lang)], defaultKeymap: false, icons: false,
          activateOnTypingDelay: 40, maxRenderedOptions: 40, closeOnBlur: !touch}),
        keymap.of([...acKeys, ...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap,
          {key: 'Tab', run: indentMore, shift: indentLess}]),
        lang === 'js' ? javascript() : [closeRawTags, html({autoCloseTags: true, matchClosingTags: true})],
        theme, wrapC.of(wrapOn ? EditorView.lineWrapping : []),
        EditorView.contentAttributes.of({dir: 'ltr', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'محرر الكود'}),
        EditorView.updateListener.of(u => {
          if (u.docChanged && !u.transactions.some(tr => tr.annotation(External))) listeners.forEach(f => f());
          if (o.onCompletions && (u.docChanged || u.selectionSet || u.transactions.some(tr => tr.effects.length) || u.focusChanged)) o.onCompletions(api.completions());
        }),
      ],
    }),
  });

  const api = {
    view,
    get value() { return view.state.doc.toString(); },
    // تعيين القيمة من الكود لا يطلق حدث input (مثل textarea تماماً)
    set value(v) {
      v = String(v == null ? '' : v);
      if (v === view.state.doc.toString()) return;
      view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: v}, annotations: External,
        selection: {anchor: Math.min(view.state.selection.main.head, v.length)}});
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
    destroy() { listeners = []; view.destroy(); },
  };
  return api;
}

export const isTouch = touch;
