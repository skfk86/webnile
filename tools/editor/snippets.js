// نظام القوالب (Snippets): مستقل عن الإكمال التلقائي وعن الإدراج السريع وعن Emmet.
// صيغة المحتوى مثل VS Code: $1 و ${1:نص بديل} لمواضع التعديل، و $0 لموضع المؤشر الأخير.
// \t في بداية السطر = مستوى إزاحة. التنقل بين المواضع بزر Tab.
import {snippet} from '@codemirror/autocomplete';

// VS Code → قالب CodeMirror. ($1 → ${1} ، ${1:x} يبقى كما هو)
export function toTemplate(body) {
  return String(body).replace(/\$(\d+)(?!\d)/g, '${$1}');
}

// معاينة نصية بلا رموز المواضع
export function preview(body) {
  return String(body).replace(/\$\{\d+:([^}]*)\}/g, '$1').replace(/\$\{?\d+\}?/g, '').replace(/\t/g, '  ');
}

export function apply(view, sn, from, to) {
  snippet(toTemplate(sn.body))(view, null, from, to);
}

// اقتراحات القوالب في قائمة الإكمال: عند كتابة جزء من اختصار القالب
export function snippetOptions(list, word) {
  const w = word.toLowerCase();
  return list.filter(s => s.prefix && s.prefix.toLowerCase().startsWith(w)).map(s => ({
    label: s.prefix, detail: s.name, type: 'keyword', boost: s.prefix.toLowerCase() === w ? 50 : -5,
    info: () => { const d = document.createElement('div'); d.className = 'cm-sn-info';
      const b = document.createElement('b'); b.textContent = s.desc || s.name; const pre = document.createElement('pre'); pre.textContent = preview(s.body);
      d.append(b, pre); return d; },
    apply: (view, c, from, to) => apply(view, s, from, to),
  }));
}

// توسيع بزر Tab: الكلمة قبل المؤشر تطابق اختصار قالب تماماً
export function expandAt(view, list) {
  const st = view.state, r = st.selection.main;
  if (!r.empty) return false;
  const line = st.doc.lineAt(r.from), before = st.sliceDoc(line.from, r.from);
  const m = /(?:^|[^\w!-])([!\w-]+)$/.exec(before);
  if (!m) return false;
  const s = list.find(x => x.prefix === m[1]);
  if (!s) return false;
  apply(view, s, r.from - m[1].length, r.from);
  return true;
}
