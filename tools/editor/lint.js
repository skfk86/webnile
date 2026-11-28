// نظام الأخطاء (Diagnostics): يعتمد على محللات حقيقية لا على البحث النصي.
//  JavaScript: محلل acorn (نفس قواعد ES2024) يعطي موضع الخطأ بدقة.
//  CSS: شجرة lezer لأخطاء الصياغة، و CSS.supports من محرك المتصفح نفسه لأسماء الخصائص الخاطئة.
//  HTML: شجرة lezer لوسوم الإغلاق غير المطابقة والوسوم غير المغلقة، مع تحذيرات تعليمية (alt، id مكرر).
// يعمل بعد توقف الكتابة (delay) فلا يبطئ الإدخال.
import {parse as acorn} from 'acorn';
import {syntaxTree, ensureSyntaxTree} from '@codemirror/language';

const AR = [
  [/^Unexpected token/, 'رمز غير متوقع في هذا المكان'],
  [/^Unterminated string constant/, 'نص لم يُغلق بعلامة التنصيص'],
  [/^Unterminated template/, 'قالب نصي ` لم يُغلق'],
  [/^Unterminated regular expression/, 'تعبير نمطي لم يُغلق'],
  [/^Unterminated comment/, 'تعليق /* لم يُغلق'],
  [/^Unexpected character/, 'حرف غير مسموح هنا'],
  [/^Identifier '(.+)' has already been declared/, 'المتغير $1 معرَّف من قبل'],
  [/^Assigning to rvalue/, 'لا يمكن الإسناد إلى هذا الطرف'],
  [/^'return' outside of function/, 'return خارج دالة'],
  [/^Unexpected keyword '(.+)'/, 'الكلمة المحجوزة $1 في غير مكانها'],
  [/^Invalid left-hand side/, 'الطرف الأيسر غير صالح للإسناد'],
  [/^Missing semicolon/, 'ينقص فاصلة منقوطة أو بين جملتين خطأ'],
];
function arabic(msg) {
  const clean = msg.replace(/\s*\(\d+:\d+\)$/, '');
  for (const [re, ar] of AR) if (re.test(clean)) return clean.replace(re, ar);
  return 'خطأ في صياغة JavaScript';
}
function jsDiag(code, offset, docLen) {
  try {
    acorn(code, {ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true});
    return [];
  } catch (e) {
    if (typeof e.pos !== 'number') return [];
    const from = Math.min(offset + e.pos, docLen), to = Math.min(from + 1, docLen);
    const en = e.message.replace(/\s*\(\d+:\d+\)$/, '');
    return [{from, to: Math.max(to, from), severity: 'error', source: 'JavaScript', message: arabic(e.message) + ' — \u2066' + en + '\u2069'}];
  }
}

const SKIP_PROP = /^(--|-webkit-|-moz-|-ms-|-o-)/;
function propOk(name) {
  if (SKIP_PROP.test(name) || typeof CSS === 'undefined' || !CSS.supports) return true;
  try { return CSS.supports(name, 'inherit'); } catch (e) { return true; }
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', '!doctype']);
const OPTIONAL_CLOSE = new Set(['p', 'li', 'td', 'th', 'tr', 'thead', 'tbody', 'tfoot', 'option', 'optgroup', 'dt', 'dd', 'html', 'head', 'body', 'colgroup', 'rt', 'rp']);

function tagName(state, node) {
  const n = node.getChild('TagName');
  return n ? state.sliceDoc(n.from, n.to).toLowerCase() : '';
}

export function lintSource(lang) {
  return view => {
    const state = view.state, len = state.doc.length, out = [];
    if (len > 400000) return out;
    if (lang === 'js') return jsDiag(state.doc.toString(), 0, len);
    const tree = ensureSyntaxTree(state, len, 300) || syntaxTree(state);
    const ids = new Map();
    tree.iterate({
      enter: n => {
        const t = n.type.name;
        if (n.type.isError) {
          // داخل style أو ملف css فقط؛ أخطاء HTML تُعالج بالأسماء أدناه
          if (lang === 'css' || /Style|Block|RuleSet|Declaration/.test(n.node.parent ? n.node.parent.type.name : ''))
            out.push({from: n.from, to: Math.max(n.to, Math.min(n.from + 1, len)), severity: 'error', source: 'CSS', message: 'خطأ في صياغة CSS: تأكد من الأقواس { } والنقطتين : والفاصلة المنقوطة ;'});
          return;
        }
        if (t === 'PropertyName' && n.node.parent && n.node.parent.type.name === 'Declaration') {
          const name = state.sliceDoc(n.from, n.to);
          if (!propOk(name)) out.push({from: n.from, to: n.to, severity: 'warning', source: 'CSS', message: `خاصية CSS غير معروفة: \u2066${name}\u2069`});
        }
        if (lang !== 'html') return;
        if (t === 'MismatchedCloseTag') out.push({from: n.from, to: n.to, severity: 'error', source: 'HTML', message: 'وسم الإغلاق لا يطابق آخر وسم مفتوح'});
        if (t === 'Element') {
          const open = n.node.firstChild;
          if (open && open.type.name === 'OpenTag') {
            const name = tagName(state, open), last = n.node.lastChild;
            const closed = last && (last.type.name === 'CloseTag' || last.type.name === 'MismatchedCloseTag');
            if (name && !closed && !VOID.has(name) && !OPTIONAL_CLOSE.has(name) && !/\/>$/.test(state.sliceDoc(open.from, open.to)))
              out.push({from: open.from, to: open.to, severity: 'warning', source: 'HTML', message: `الوسم \u2066<${name}>\u2069 لم يُغلق. أضف \u2066</${name}>\u2069`});
          }
        }
        if (t === 'OpenTag' || t === 'SelfClosingTag') {
          const name = tagName(state, n.node), text = state.sliceDoc(n.from, n.to);
          if (name === 'img' && !/\balt\s*=/.test(text)) out.push({from: n.from, to: n.to, severity: 'info', source: 'HTML', message: 'أضف alt للصورة: يقرؤه قارئ الشاشة ويظهر إن لم تُحمَّل'});
          const m = /\bid\s*=\s*["']([^"']+)["']/.exec(text);
          if (m) { if (ids.has(m[1])) out.push({from: n.from, to: n.to, severity: 'warning', source: 'HTML', message: `id مكرر: "${m[1]}" يجب أن يكون فريداً في الصفحة`}); else ids.set(m[1], n.from); }
        }
        if (t === 'ScriptText') out.push(...jsDiag(state.sliceDoc(n.from, n.to), n.from, len));
      },
    });
    return out;
  };
}
