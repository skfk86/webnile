// فهرس المشروع: أسماء classes و IDs ومتغيرات CSS وملفات المشروع، تُستخرج من كل الملفات المفتوحة.
// يُبنى عند الطلب فقط (عند فتح الإكمال)، ويُخزَّن حتى يتغير أي ملف، فلا نعيد تحليل المشروع مع كل ضغطة.

const uniq = a => [...new Set(a)].filter(Boolean).sort();

export function buildIndex(files) {
  const classes = [], ids = [], vars = [], defClasses = [], defIds = [];
  for (const f of files) {
    const s = f.text || '';
    const cssParts = f.lang === 'css' ? [s] : f.lang === 'html' ? [...s.matchAll(/<style[^>]*>([\s\S]*?)(?:<\/style>|$)/gi)].map(m => m[1]) : [];
    for (const c of cssParts) {
      const noBlocks = c.replace(/\/\*[\s\S]*?\*\//g, '');
      // المحددات فقط (ما قبل {)، كي لا نلتقط .5s أو #fff من القيم
      for (const sel of noBlocks.match(/[^{};]+(?=\{)/g) || []) {
        for (const m of sel.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) defClasses.push(m[1]);
        for (const m of sel.matchAll(/#(-?[A-Za-z_][\w-]*)/g)) defIds.push(m[1]);
      }
      for (const m of noBlocks.matchAll(/(--[\w-]+)\s*:/g)) vars.push(m[1]);
    }
    if (f.lang === 'html') {
      for (const m of s.matchAll(/\bclass\s*=\s*["']([^"']*)["']/gi)) classes.push(...m[1].split(/\s+/));
      for (const m of s.matchAll(/\bid\s*=\s*["']([^"']*)["']/gi)) ids.push(m[1].trim());
    }
    if (f.lang === 'js' || f.lang === 'html') {
      for (const m of s.matchAll(/classList\.(?:add|remove|toggle|contains)\(\s*["'`]([\w-]+)/g)) classes.push(m[1]);
      for (const m of s.matchAll(/getElementById\(\s*["'`]([\w-]+)/g)) ids.push(m[1]);
    }
  }
  return {
    classes: uniq([...defClasses, ...classes]), ids: uniq([...defIds, ...ids]), vars: uniq(vars),
    defClasses: new Set(defClasses), defIds: new Set(defIds),
    files: files.map(f => f.name).filter(Boolean),
  };
}

// سياق CSS: هل المؤشر في مكان محدد (selector) أم داخل قاعدة؟ (نصّ CSS قبل المؤشر فقط)
function cssCtx(before) {
  const stack = [];
  const re = /\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'|([^{}]*)\{|\}/g;
  let m;
  while ((m = re.exec(before))) {
    if (m[0] === '}') stack.pop();
    else if (m[0].endsWith('{')) stack.push(/^\s*@(media|supports|container|layer)/.test(m[1] || ''));
  }
  // في القمة أو داخل @media مباشرة: محدد. داخل قاعدة عادية: خصائص وقيم
  return {k: !stack.length || stack[stack.length - 1] ? 'selector' : 'decl'};
}

const opt = (label, type, detail, info, boost = 0) => ({label, type, detail, info, boost});

// يُرجع اقتراحات المشروع لسياق المؤشر، أو null إن لم يكن السياق سياقنا
export function projectCompletions(ctx, lang, getIndex) {
  const st = ctx.state, pos = ctx.pos;
  const line = st.doc.lineAt(pos), before = st.sliceDoc(line.from, pos);
  let m;
  // HTML: class="… | و id="| و href/src="|
  if (lang === 'html') {
    if ((m = before.match(/\bclass\s*=\s*["'](?:[^"']*\s)?([\w-]*)$/i))) {
      const I = getIndex(), w = m[1], used = new Set(before.match(/class\s*=\s*["']([^"']*)$/i)[1].split(/\s+/));
      const options = I.classes.filter(c => !used.has(c) || c === w).map(c => opt(c, 'class', I.defClasses.has(c) ? 'معرّف في CSS' : 'مستعمل في المشروع'));
      return options.length ? {from: pos - w.length, options, validFor: /^[\w-]*$/} : null;
    }
    if ((m = before.match(/\bid\s*=\s*["']([\w-]*)$/i))) {
      const I = getIndex(), w = m[1];
      const options = I.ids.filter(x => I.defIds.has(x)).map(x => opt(x, 'constant', 'محدد في CSS'));
      return options.length ? {from: pos - w.length, options, validFor: /^[\w-]*$/} : null;
    }
    if ((m = before.match(/\b(?:href|src)\s*=\s*["']([\w./-]*)$/i))) {
      const I = getIndex(), w = m[1];
      const options = I.files.map(f => opt(f, 'text', 'ملف في المشروع'));
      return options.length ? {from: pos - w.length, options, validFor: /^[\w./-]*$/} : null;
    }
  }
  // CSS (ملف css أو داخل <style>)
  const inCss = lang === 'css' || (lang === 'html' && /<style[^>]*>(?![\s\S]*<\/style>)/i.test(st.sliceDoc(Math.max(0, pos - 20000), pos)));
  if (inCss) {
    const text = lang === 'css' ? st.sliceDoc(0, pos) : st.sliceDoc(0, pos).replace(/^[\s\S]*<style[^>]*>/i, '');
    if ((m = before.match(/var\(\s*(-{0,2}[\w-]*)$/))) {
      const I = getIndex(), w = m[1];
      return I.vars.length ? {from: pos - w.length, options: I.vars.map(v => opt(v, 'variable', 'متغير CSS')), validFor: /^-{0,2}[\w-]*$/} : null;
    }
    const c = cssCtx(text);
    if (c.k === 'selector' && (m = before.match(/([.#])([\w-]*)$/)) && !/\d$/.test(before.slice(0, -m[0].length))) {
      const I = getIndex(), w = m[2], list = m[1] === '.' ? I.classes : I.ids;
      const options = list.map(x => opt(m[1] + x, m[1] === '.' ? 'class' : 'constant', 'من HTML'));
      return options.length ? {from: pos - w.length - 1, options, validFor: /^[.#]?[\w-]*$/} : null;
    }
  }
  // JS: داخل نص querySelector / getElementById / classList
  if (lang === 'js' || lang === 'html') {
    if ((m = before.match(/querySelector(?:All)?\(\s*["'`]([.#]?)([\w-]*)$/))) {
      const I = getIndex(), p = m[1], w = m[2];
      const list = p === '.' ? I.classes.map(x => '.' + x) : p === '#' ? I.ids.map(x => '#' + x) : [...I.ids.map(x => '#' + x), ...I.classes.map(x => '.' + x)];
      return list.length ? {from: pos - w.length - p.length, options: list.map(x => opt(x, x[0] === '.' ? 'class' : 'constant', 'من HTML')), validFor: /^[.#]?[\w-]*$/} : null;
    }
    if ((m = before.match(/getElementById\(\s*["'`]([\w-]*)$/))) {
      const I = getIndex(), w = m[1];
      return I.ids.length ? {from: pos - w.length, options: I.ids.map(x => opt(x, 'constant', 'id من HTML')), validFor: /^[\w-]*$/} : null;
    }
    if ((m = before.match(/classList\.(?:add|remove|toggle|contains)\(\s*["'`]([\w-]*)$/))) {
      const I = getIndex(), w = m[1];
      return I.classes.length ? {from: pos - w.length, options: I.classes.map(x => opt(x, 'class', 'class من المشروع')), validFor: /^[\w-]*$/} : null;
    }
  }
  return null;
}

// واجهات JavaScript الشائعة مع شرح مختصر (تظهر بعد النقطة)
const D = (label, detail, info, type = 'method') => ({label, detail, info, type});
export const JS_MEMBERS = {
  document: [D('querySelector', '(selector)', 'يرجع أول عنصر يطابق المحدد'), D('querySelectorAll', '(selector)', 'يرجع كل العناصر المطابقة (NodeList)'),
    D('getElementById', '(id)', 'يرجع العنصر صاحب هذا id'), D('createElement', '(tag)', 'ينشئ عنصراً جديداً'),
    D('addEventListener', '(type, fn)', 'يستمع لحدث على الصفحة'), D('body', '', 'عنصر body', 'property'), D('title', '', 'عنوان الصفحة', 'property'),
    D('documentElement', '', 'عنصر html', 'property')],
  console: [D('log', '(...values)', 'يطبع في الكونسول'), D('error', '(...values)', 'يطبع خطأ'), D('warn', '(...values)', 'يطبع تحذيراً'), D('table', '(data)', 'يطبع مصفوفة أو كائناً كجدول')],
  Math: [D('random', '()', 'رقم عشوائي من 0 إلى أقل من 1'), D('round', '(x)', 'تقريب لأقرب عدد صحيح'), D('floor', '(x)', 'تقريب للأسفل'),
    D('ceil', '(x)', 'تقريب للأعلى'), D('max', '(...n)', 'أكبر قيمة'), D('min', '(...n)', 'أصغر قيمة'), D('abs', '(x)', 'القيمة المطلقة'),
    D('pow', '(x, y)', 'x أس y'), D('sqrt', '(x)', 'الجذر التربيعي'), D('PI', '', '3.14159…', 'constant')],
  JSON: [D('stringify', '(value)', 'يحوّل قيمة إلى نص JSON'), D('parse', '(text)', 'يحوّل نص JSON إلى قيمة')],
  localStorage: [D('setItem', '(key, value)', 'يحفظ نصاً في الجهاز'), D('getItem', '(key)', 'يقرأ قيمة محفوظة'), D('removeItem', '(key)', 'يحذف قيمة'), D('clear', '()', 'يحذف كل القيم')],
  Object: [D('keys', '(obj)', 'مصفوفة المفاتيح'), D('values', '(obj)', 'مصفوفة القيم'), D('entries', '(obj)', 'أزواج [مفتاح, قيمة]'), D('assign', '(target, ...src)', 'ينسخ الخصائص')],
  Array: [D('isArray', '(x)', 'هل القيمة مصفوفة؟'), D('from', '(iterable)', 'ينشئ مصفوفة')],
  Number: [D('parseInt', '(text)', 'نص إلى عدد صحيح'), D('parseFloat', '(text)', 'نص إلى عدد عشري'), D('isNaN', '(x)', 'هل القيمة NaN؟')],
  window: [D('addEventListener', '(type, fn)', 'يستمع لحدث'), D('innerWidth', '', 'عرض النافذة', 'property'), D('setTimeout', '(fn, ms)', 'ينفذ بعد مدة'), D('setInterval', '(fn, ms)', 'ينفذ كل مدة')],
};
// أعضاء عامة لأي قيمة (عناصر DOM ومصفوفات ونصوص)
export const JS_ANY = [
  D('addEventListener', '(type, fn)', 'عنصر: يستمع لحدث مثل click'), D('textContent', '', 'عنصر: النص داخله', 'property'), D('innerHTML', '', 'عنصر: HTML داخله', 'property'),
  D('classList', '', 'عنصر: add / remove / toggle / contains', 'property'), D('style', '', 'عنصر: التنسيق المباشر', 'property'), D('value', '', 'حقل إدخال: القيمة', 'property'),
  D('appendChild', '(node)', 'عنصر: يضيف ابناً في النهاية'), D('remove', '()', 'عنصر: يحذف نفسه'), D('setAttribute', '(name, value)', 'عنصر: يضبط خاصية'),
  D('getAttribute', '(name)', 'عنصر: يقرأ خاصية'), D('dataset', '', 'عنصر: خصائص data-*', 'property'), D('querySelector', '(selector)', 'عنصر: يبحث داخله'),
  D('length', '', 'مصفوفة/نص: الطول', 'property'), D('push', '(...items)', 'مصفوفة: يضيف في النهاية'), D('pop', '()', 'مصفوفة: يحذف الأخير'),
  D('map', '(fn)', 'مصفوفة: مصفوفة جديدة بنتيجة الدالة'), D('filter', '(fn)', 'مصفوفة: العناصر التي تحقق الشرط'), D('forEach', '(fn)', 'مصفوفة: ينفذ لكل عنصر'),
  D('find', '(fn)', 'مصفوفة: أول عنصر يحقق الشرط'), D('reduce', '(fn, start)', 'مصفوفة: يجمع إلى قيمة واحدة'), D('includes', '(x)', 'مصفوفة/نص: هل يحتوي؟'),
  D('indexOf', '(x)', 'موضع القيمة أو -1'), D('join', '(sep)', 'مصفوفة: إلى نص'), D('slice', '(start, end)', 'جزء من مصفوفة/نص'),
  D('sort', '(fn)', 'مصفوفة: ترتيب'), D('splice', '(i, n, ...items)', 'مصفوفة: حذف/إدراج'), D('toUpperCase', '()', 'نص: أحرف كبيرة'),
  D('toLowerCase', '()', 'نص: أحرف صغيرة'), D('trim', '()', 'نص: حذف المسافات من الطرفين'), D('split', '(sep)', 'نص: إلى مصفوفة'),
  D('replace', '(a, b)', 'نص: استبدال'), D('toFixed', '(digits)', 'عدد: بعدد خانات عشرية'), D('then', '(fn)', 'Promise: بعد النجاح'),
  D('json', '()', 'Response: يقرأ JSON'),
];
