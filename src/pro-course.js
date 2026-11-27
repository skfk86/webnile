/* ويب نايل برو — وحدة "مشاريع احترافية"
   ستة مشاريع حقيقية يبنيها المشترك في برو، لكل مشروع اختبار فهم وتحدٍّ إضافي وحل نموذجي (sol).
   تُضاف إلى LESSONS في index.html مع العلامة pro:1، ولا تُحتسب ضمن دروس الشهادة المجانية. */
var PRO_COURSE=(function(){
var ok0=['لا توجد أخطاء',function(c){return !c.err&&!c.logs.some(function(l){return l[0]==='!'})}];
var T=function(c,i){return String(c.t[i]==null?'':c.t[i])};

var lessons=[
/* ───────── 1. صفحة هبوط متجاوبة ───────── */
{id:'xLand',k:'html',ic:'layout',t:'صفحة هبوط لمقهى',
g:'تبني صفحة هبوط كاملة كالتي يطلبها العملاء فعلاً: شريط تنقل، وواجهة جذابة، وبطاقات مزايا، وتذييل، وتعمل على كل الشاشات.',
s:['ابدأ بالهيكل (header ← hero ← features ← footer) ثم التنسيق.','متغير واحد للون الأساسي `--main` يجعل تغيير هوية الموقع سطراً واحداً.','`grid` مع `@media` يحوّل البطاقات من أعمدة إلى عمود واحد على الهاتف.'],
e:'تثبيت عرض البطاقات بالبكسل، فتخرج عن الشاشة في الهاتف. استعمل `1fr` أو نسباً مئوية.',
body:[
'صفحة الهبوط (Landing Page) هي **أكثر ما يطلبه العملاء** من مطوّر الويب المستقل: مطعم، أو مقهى، أو دورة، أو تطبيق يريد صفحة تعرّف به وتدفع الزائر لخطوة واحدة.',
'كل صفحة هبوط ناجحة تتبع الترتيب نفسه تقريباً:',
{c:'<header>شعار + روابط التنقل</header>\n<section class="hero">عنوان كبير + زر دعوة (CTA)</section>\n<section id="features">3 بطاقات مزايا</section>\n<footer>معلومات التواصل</footer>'},
'زر الدعوة `.cta` هو أهم عنصر في الصفحة. اجعله واضحاً بلون الهوية، وهنا يفيدك المتغير:',
{c:':root {\n  --main: #0E7C86;\n}\n.cta {\n  background: var(--main);\n  color: white;\n  padding: 12px 24px;\n  border-radius: 99px;\n  text-decoration: none;\n}'},
'وللبطاقات استعمل `grid` بثلاثة أعمدة، ثم حوّلها إلى عمود واحد في الشاشات الصغيرة:',
{c:'#features {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}\n@media (max-width: 600px) {\n  #features {\n    grid-template-columns: 1fr;\n  }\n}'},
{tip:'اكتب نصوصاً حقيقية لا "نص تجريبي". العميل يحكم على الصفحة من كلماتها قبل ألوانها، وهذا ما يجعل المشروع صالحاً لمعرض أعمالك.'}],
task:'ابنِ صفحة هبوط لمقهى: `nav` فيه 3 روابط على الأقل، وقسم `.hero` فيه `h1` ورابط `a.cta` يستعمل `var(--main)`، و3 بطاقات `.feature` داخل `#features` مرتبة بـ `grid` أو `flex`، وقاعدة `@media`، وتذييل فيه نص.',
start:'<style>\n  :root {\n    --main: #0E7C86;\n  }\n  \n</style>\n<header>\n  <b>نايل كافيه</b>\n  <nav></nav>\n</header>\n<section class="hero">\n  \n</section>\n<section id="features">\n  \n</section>\n<footer></footer>\n',
sol:'<style>\n  :root {\n    --main: #0E7C86;\n  }\n  body { margin: 0; }\n  header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    padding: 12px 16px;\n  }\n  nav a { margin-inline-start: 12px; color: var(--main); }\n  .hero {\n    text-align: center;\n    padding: 40px 16px;\n    background: #E8F7F5;\n  }\n  .cta {\n    display: inline-block;\n    background: var(--main);\n    color: white;\n    padding: 12px 24px;\n    border-radius: 99px;\n    text-decoration: none;\n  }\n  #features {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 12px;\n    padding: 16px;\n  }\n  .feature {\n    padding: 16px;\n    border-radius: 16px;\n    background: #F5F5F5;\n  }\n  @media (max-width: 600px) {\n    #features { grid-template-columns: 1fr; }\n  }\n  footer { text-align: center; padding: 16px; color: #666; }\n</style>\n<header>\n  <b>نايل كافيه</b>\n  <nav>\n    <a href="#menu">القائمة</a>\n    <a href="#features">لماذا نحن</a>\n    <a href="#contact">تواصل</a>\n  </nav>\n</header>\n<section class="hero">\n  <h1>قهوة مختصة على ضفاف النيل</h1>\n  <p>حبوب محمّصة يومياً وجلسات هادئة للعمل والدراسة.</p>\n  <a class="cta" href="#contact">احجز طاولتك</a>\n</section>\n<section id="features">\n  <div class="feature"><h3>☕ تحميص يومي</h3><p>نحمّص الحبوب كل صباح.</p></div>\n  <div class="feature"><h3>📶 إنترنت سريع</h3><p>مكان مثالي للعمل.</p></div>\n  <div class="feature"><h3>🌅 إطلالة</h3><p>شرفة مطلة على النيل.</p></div>\n</section>\n<footer id="contact">نفتح يومياً من 8 صباحاً · القاهرة</footer>\n',
checks:[
['nav فيه 3 روابط على الأقل',function(d){return d.querySelectorAll('nav a').length>=3}],
['قسم .hero فيه h1 ورابط a.cta',function(d){return d.querySelector('.hero h1')&&d.querySelector('.hero a.cta')}],
['3 بطاقات .feature داخل #features',function(d){return d.querySelectorAll('#features .feature').length>=3}],
['#features مرتبة بـ grid أو flex',function(d){var e=d.querySelector('#features');return e&&/grid|flex/.test(d.defaultView.getComputedStyle(e).display)}],
['زر .cta يستعمل var(--main)',function(d){return anyRule(d,function(r){return r.selectorText&&r.selectorText.indexOf('.cta')>-1&&/var\(\s*--main\s*\)/.test(r.cssText)})}],
['قاعدة @media للشاشات الصغيرة',function(d){return anyRule(d,function(r){return r.media&&r.cssRules&&r.cssRules.length>0})}],
['تذييل footer فيه نص',function(d){var f=d.querySelector('footer');return f&&f.textContent.trim().length>2}]]},

/* ───────── 2. حاسبة تقسيم الفاتورة ───────── */
{id:'xBill',k:'js',ic:'hash',t:'حاسبة تقسيم الفاتورة',
page:'<input id="bill" type="number" placeholder="قيمة الفاتورة">\n<select id="tip"><option value="0">بدون بقشيش</option><option value="10">10%</option><option value="15">15%</option></select>\n<input id="people" type="number" value="1" placeholder="عدد الأشخاص">\n<button id="calc">احسب</button>\n<p id="result"></p>',
g:'تبني أداة يستعملها الناس فعلاً: تقرأ مدخلات، وتتحقق منها، وتحسب، وتعرض النتيجة بتنسيق مالي صحيح.',
s:['افصل الحساب في دالة نقية `split()` لا تعرف شيئاً عن الصفحة، فيسهل اختبارها.','قيم الحقول نصوص دائماً، فحوّلها بـ `Number()` قبل الحساب.','تحقق من المدخلات قبل الحساب، و`toFixed(2)` يعرض المبلغ بخانتين عشريتين.'],
e:'جمع قيم الحقول مباشرة: `"100" + "10"` تعطي `"10010"` لا `110`.',
body:[
'أغلب التطبيقات الحقيقية تتبع ثلاث خطوات: **اقرأ ← تحقّق ← احسب واعرض**. هذا المشروع يدرّبك عليها في أداة صغيرة مفيدة.',
'أولاً الحساب نفسه، في دالة لا تلمس الصفحة إطلاقاً. هذا يسمى **دالة نقية**: نفس المدخلات تعطي نفس النتيجة دائماً:',
{c:'function split(bill, tipPercent, people) {\n  const total = bill + bill * tipPercent / 100;\n  return total / people;\n}\nsplit(100, 10, 2); // 55'},
'ثم الواجهة: اقرأ القيم وحوّلها إلى أرقام، وارفض المدخلات غير المنطقية قبل أن تحسب:',
{c:'const bill = Number(billEl.value);\nconst people = Number(peopleEl.value);\nif (!bill || bill <= 0 || people < 1) {\n  result.textContent = "أدخل أرقاماً صحيحة";\n  return;\n}'},
{tip:'`Number("")` تعطي `0` و`Number("abc")` تعطي `NaN`، والشرط `!bill` يرفض الاثنين معاً.'}],
task:'اكتب `split(bill, tipPercent, people)` التي تعيد نصيب كل شخص. وعند الضغط على `#calc` اقرأ الحقول: إن كانت الفاتورة فارغة أو صفراً أو عدد الأشخاص أقل من 1 اكتب "أدخل أرقاماً صحيحة" في `#result`، وإلا اكتب "نصيب كل شخص: " والمبلغ بـ `toFixed(2)`.',
start:'const billEl = document.querySelector("#bill");\nconst tipEl = document.querySelector("#tip");\nconst peopleEl = document.querySelector("#people");\nconst result = document.querySelector("#result");\n\nfunction split(bill, tipPercent, people) {\n  // أعد نصيب كل شخص\n}\n\ndocument.querySelector("#calc").addEventListener("click", () => {\n  \n});\n',
sol:'const billEl = document.querySelector("#bill");\nconst tipEl = document.querySelector("#tip");\nconst peopleEl = document.querySelector("#people");\nconst result = document.querySelector("#result");\n\nfunction split(bill, tipPercent, people) {\n  const total = bill + bill * tipPercent / 100;\n  return total / people;\n}\n\ndocument.querySelector("#calc").addEventListener("click", () => {\n  const bill = Number(billEl.value);\n  const tip = Number(tipEl.value);\n  const people = Number(peopleEl.value);\n  if (!bill || bill <= 0 || !people || people < 1) {\n    result.textContent = "أدخل أرقاماً صحيحة";\n    return;\n  }\n  result.textContent = "نصيب كل شخص: " + split(bill, tip, people).toFixed(2);\n});\n',
tests:'(function(){__t(typeof split==="function"?split(100,10,2):null);__t(typeof split==="function"?split(90,0,3):null);var B=document.getElementById("bill"),P=document.getElementById("tip"),N=document.getElementById("people"),C=document.getElementById("calc"),R=document.getElementById("result");if(!B||!C||!R)return;B.value="200";P.value="15";N.value="4";C.click();__t(R.textContent);B.value="";C.click();__t(R.textContent);B.value="50";N.value="0";C.click();__t(R.textContent)})();',
checks:[ok0,
['split(100, 10, 2) تعيد 55',function(c){return Number(c.t[0])===55}],
['split(90, 0, 3) تعيد 30',function(c){return Number(c.t[1])===30}],
['200 بـ 15% على 4 أشخاص تعرض 57.50',function(c){return T(c,2).indexOf('57.50')>-1}],
['فاتورة فارغة: "أدخل أرقاماً صحيحة"',function(c){return T(c,3).indexOf('صحيحة')>-1}],
['عدد أشخاص 0 مرفوض',function(c){return T(c,4).indexOf('صحيحة')>-1}]]},

/* ───────── 3. معرض بفلاتر ───────── */
{id:'xGal',k:'js',ic:'grid',t:'معرض بفلاتر ذكية',
page:'<div id="filters">\n  <button data-cat="all" class="on">الكل</button>\n  <button data-cat="food">أكلات</button>\n  <button data-cat="place">أماكن</button>\n</div>\n<div id="items">\n  <div class="item" data-cat="food">كشري</div>\n  <div class="item" data-cat="place">الأهرامات</div>\n  <div class="item" data-cat="food">فول</div>\n  <div class="item" data-cat="place">الأقصر</div>\n  <div class="item" data-cat="food">ملوخية</div>\n</div>\n<p id="status"></p>\n<style>#filters .on{background:#0E7C86;color:#fff}</style>',
g:'تبني الفلترة التي تراها في كل متجر ومعرض أعمال، بمستمع واحد لكل الأزرار بدل مستمع لكل زر.',
s:['`data-cat` يخزّن التصنيف داخل العنصر نفسه، وتقرؤه بـ `dataset.cat`.','تفويض الأحداث: مستمع واحد على الأب، و`e.target.closest("button")` يعرف أي زر ضُغط.','`classList.toggle("on", شرط)` يضيف الصنف أو يزيله في سطر واحد.'],
e:'نسيان إزالة `on` من الزر السابق، فيظهر أكثر من فلتر نشطاً معاً.',
body:[
'المتاجر ومعارض الأعمال كلها فيها أزرار مثل "الكل / أحذية / قمصان". الفكرة بسيطة: كل عنصر يحمل تصنيفه، والفلتر يُظهر ما يطابق ويُخفي الباقي.',
'نخزّن التصنيف في سمة `data-*`، وتصل إليها JavaScript عبر `dataset`:',
{c:'<div class="item" data-cat="food">كشري</div>\n\nitem.dataset.cat; // "food"'},
'بدل أن تضيف مستمعاً لكل زر، ضع **مستمعاً واحداً على الأب**. هذا يسمى تفويض الأحداث، ويعمل حتى مع الأزرار التي تضيفها لاحقاً:',
{c:'filters.addEventListener("click", (e) => {\n  const btn = e.target.closest("button");\n  if (!btn) return;\n  filter(btn.dataset.cat);\n});'},
'ودالة `filter` تمر على العناصر وتقرر لكل واحد:',
{c:'items.forEach(item => {\n  const show = cat === "all" || item.dataset.cat === cat;\n  item.style.display = show ? "" : "none";\n});'},
{tip:'`style.display = ""` تعيد العنصر لعرضه الطبيعي من CSS، وهذا أفضل من كتابة "block" لأن العنصر قد يكون flex أو grid.'}],
task:'عند الضغط على أي زر في `#filters`: أظهر العناصر `.item` التي تطابق `data-cat` (و"all" تُظهر الكل) وأخفِ الباقي، وانقل الصنف `on` إلى الزر المضغوط وحده، واكتب عدد العناصر الظاهرة في `#status` مثل "يظهر 3 عناصر".',
start:'const filters = document.querySelector("#filters");\nconst items = document.querySelectorAll(".item");\nconst statusEl = document.querySelector("#status");\n\nfunction filter(cat) {\n  \n}\n\n',
sol:'const filters = document.querySelector("#filters");\nconst items = document.querySelectorAll(".item");\nconst statusEl = document.querySelector("#status");\n\nfunction filter(cat) {\n  let count = 0;\n  items.forEach(item => {\n    const show = cat === "all" || item.dataset.cat === cat;\n    item.style.display = show ? "" : "none";\n    if (show) count++;\n  });\n  filters.querySelectorAll("button").forEach(b => {\n    b.classList.toggle("on", b.dataset.cat === cat);\n  });\n  statusEl.textContent = "يظهر " + count + " عناصر";\n}\n\nfilters.addEventListener("click", (e) => {\n  const btn = e.target.closest("button");\n  if (!btn) return;\n  filter(btn.dataset.cat);\n});\n',
tests:'(function(){function V(){return [].filter.call(document.querySelectorAll(".item"),function(e){return getComputedStyle(e).display!=="none"&&!e.hidden}).length}function on(){return [].map.call(document.querySelectorAll("#filters .on"),function(b){return b.dataset.cat}).join(",")}function B(c){return document.querySelector("#filters [data-cat="+c+"]")}var S=document.getElementById("status");B("food").click();__t(V());__t(on());__t(S?S.textContent:"");B("place").click();__t(V());__t(on());B("all").click();__t(V());__t(on())})();',
checks:[ok0,
['"أكلات" تُظهر 3 عناصر فقط',function(c){return c.t[0]===3}],
['"أماكن" تُظهر عنصرين',function(c){return c.t[3]===2}],
['"الكل" تعيد العناصر الخمسة',function(c){return c.t[5]===5}],
['الصنف on على الزر المضغوط وحده',function(c){return c.t[1]==='food'&&c.t[4]==='place'&&c.t[6]==='all'}],
['#status يعرض العدد',function(c){return /3/.test(T(c,2))}]]},

/* ───────── 4. فاحص قوة كلمة المرور ───────── */
{id:'xPass',k:'js',ic:'lock',t:'فاحص قوة كلمة المرور',
page:'<input id="pw" type="text" placeholder="اكتب كلمة مرور">\n<div style="height:8px;background:#eee;border-radius:8px;margin:8px 0;overflow:hidden"><div id="bar" style="height:100%;width:0;background:#0E7C86;transition:.3s"></div></div>\n<p id="label"></p>',
g:'تبني ميزة موجودة في كل صفحة تسجيل: تقييم فوري لكلمة المرور أثناء الكتابة، بالتعبيرات النمطية.',
s:['`/\\d/.test(pw)` تسأل: هل في النص رقم؟ و`/[A-Z]/` حرف كبير.','`/[^A-Za-z0-9]/` تعني أي رمز ليس حرفاً ولا رقماً.','حدث `input` يعمل مع كل حرف، فالتقييم فوري.'],
e:'استعمال حدث `change` بدل `input`، فلا يتحدث التقييم إلا بعد مغادرة الحقل.',
body:[
'كل صفحة تسجيل محترمة تخبرك أثناء الكتابة: كلمة مرورك ضعيفة أو قوية. سنبني هذا بنظام نقاط بسيط.',
'التعبيرات النمطية (RegEx) أنماط تبحث في النص. `test` تعيد `true` إن وجدت النمط:',
{c:'/\\d/.test("abc1");      // true  (فيه رقم)\n/[A-Z]/.test("abc");     // false (لا حرف كبير)\n/[^A-Za-z0-9]/.test("a!"); // true  (فيه رمز)'},
'كل شرط يتحقق يضيف نقطة، والمجموع من 0 إلى 4:',
{c:'function strength(pw) {\n  let score = 0;\n  if (pw.length >= 8) score++;\n  if (/\\d/.test(pw)) score++;\n  // أكمل: حرف كبير، ورمز\n  return score;\n}'},
{tip:'حوّل النقاط إلى عرض الشريط مباشرة: `score * 25 + "%"`. هكذا 4 نقاط تعني شريطاً ممتلئاً.'}],
task:'اكتب `strength(pw)` التي تعيد نقاطاً من 0 إلى 4: نقطة للطول 8 فأكثر، ونقطة لوجود رقم، ونقطة لحرف إنجليزي كبير، ونقطة لرمز. ومع كل حرف في `#pw` اكتب في `#label`: "ضعيفة" (0–1) أو "متوسطة" (2–3) أو "قوية" (4)، واجعل عرض `#bar` يساوي النقاط × 25%.',
start:'const pw = document.querySelector("#pw");\nconst bar = document.querySelector("#bar");\nconst label = document.querySelector("#label");\n\nfunction strength(text) {\n  let score = 0;\n  \n  return score;\n}\n\n',
sol:'const pw = document.querySelector("#pw");\nconst bar = document.querySelector("#bar");\nconst label = document.querySelector("#label");\n\nfunction strength(text) {\n  let score = 0;\n  if (text.length >= 8) score++;\n  if (/\\d/.test(text)) score++;\n  if (/[A-Z]/.test(text)) score++;\n  if (/[^A-Za-z0-9]/.test(text)) score++;\n  return score;\n}\n\npw.addEventListener("input", () => {\n  const s = strength(pw.value);\n  label.textContent = s <= 1 ? "ضعيفة" : s <= 3 ? "متوسطة" : "قوية";\n  bar.style.width = s * 25 + "%";\n});\n',
tests:'(function(){var f=typeof strength==="function";__t(f?strength("abc"):null);__t(f?strength("abcdefgh1"):null);__t(f?strength("Abcdefg1!"):null);var I=document.getElementById("pw"),L=document.getElementById("label"),B=document.getElementById("bar");if(!I||!L)return;function w(v){I.value=v;I.dispatchEvent(new Event("input",{bubbles:true}));return L.textContent.trim()}__t(w("abc"));__t(w("abcdefgh1"));__t(w("Abcdefg1!"));__t(B?B.style.width:"")})();',
checks:[ok0,
['strength("abc") تعيد 0',function(c){return c.t[0]===0}],
['strength("abcdefgh1") تعيد 2',function(c){return c.t[1]===2}],
['strength("Abcdefg1!") تعيد 4',function(c){return c.t[2]===4}],
['التقييم يتحدث أثناء الكتابة: ضعيفة ← متوسطة ← قوية',function(c){return T(c,3)==='ضعيفة'&&T(c,4)==='متوسطة'&&T(c,5)==='قوية'}],
['الشريط ممتلئ 100% للكلمة القوية',function(c){return T(c,6)==='100%'}]]},

/* ───────── 5. متتبّع المصاريف ───────── */
{id:'xExp',k:'js',ic:'list',t:'متتبّع المصاريف',
page:'<input id="name" placeholder="البند (مثلاً: مواصلات)">\n<input id="amount" type="number" placeholder="المبلغ">\n<button id="add">أضف</button>\n<ul id="list"></ul>\n<p id="total">المجموع: 0</p>',
g:'تبني تطبيقاً كاملاً بنمط "حالة ← حفظ ← رسم": يضيف ويحذف ويحسب ويتذكر بياناته بعد إغلاق التطبيق.',
s:['مصدر الحقيقة مصفوفة واحدة `expenses`، والصفحة مجرد رسم لها.','بعد كل تغيير: `save()` ثم `render()`. لا تعدّل الصفحة يدوياً.','`JSON.stringify` للحفظ و`JSON.parse` للتحميل، مع `|| "[]"` لأول تشغيل.'],
e:'تعديل عناصر الصفحة مباشرة عند الحذف ونسيان المصفوفة، فيرجع البند المحذوف بعد إعادة الفتح.',
body:[
'هذا أقرب مشروع لتطبيق حقيقي في الدورة. القاعدة الذهبية: **البيانات في مصفوفة، والصفحة ترسم المصفوفة**. أي تغيير يمر بالمصفوفة أولاً.',
'عند بدء التطبيق حمّل البيانات المحفوظة، أو ابدأ بمصفوفة فارغة في أول تشغيل:',
{c:'let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");\n\nfunction save() {\n  localStorage.setItem("expenses", JSON.stringify(expenses));\n}'},
'دالة `render()` تفرّغ القائمة وترسمها من جديد، وتحسب المجموع بـ `reduce`:',
{c:'function render() {\n  list.innerHTML = "";\n  expenses.forEach((item, i) => {\n    const li = document.createElement("li");\n    li.textContent = item.name + " — " + item.amount + " ";\n    const del = document.createElement("button");\n    del.className = "del";\n    del.textContent = "حذف";\n    del.onclick = () => { expenses.splice(i, 1); save(); render(); };\n    li.appendChild(del);\n    list.appendChild(li);\n  });\n  const sum = expenses.reduce((s, x) => s + x.amount, 0);\n  total.textContent = "المجموع: " + sum;\n}'},
{tip:'`splice(i, 1)` يحذف عنصراً واحداً من المصفوفة عند الموضع `i`. بعدها `save()` و`render()` وانتهى.'}],
task:'حمّل `expenses` من `localStorage` (المفتاح "expenses"). عند الضغط على `#add` أضف `{name, amount}` (المبلغ رقم) وتجاهل البند الفارغ أو المبلغ صفر وأقل، ثم احفظ وارسم. كل `li` فيه زر حذف بالصنف `del`، و`#total` يعرض "المجموع: " ومجموع المبالغ.',
start:'const nameEl = document.querySelector("#name");\nconst amountEl = document.querySelector("#amount");\nconst list = document.querySelector("#list");\nconst total = document.querySelector("#total");\n\nlet expenses = [];\n\nfunction save() {\n  \n}\n\nfunction render() {\n  \n}\n\ndocument.querySelector("#add").addEventListener("click", () => {\n  \n});\n\nrender();\n',
sol:'const nameEl = document.querySelector("#name");\nconst amountEl = document.querySelector("#amount");\nconst list = document.querySelector("#list");\nconst total = document.querySelector("#total");\n\nlet expenses = JSON.parse(localStorage.getItem("expenses") || "[]");\n\nfunction save() {\n  localStorage.setItem("expenses", JSON.stringify(expenses));\n}\n\nfunction render() {\n  list.innerHTML = "";\n  expenses.forEach((item, i) => {\n    const li = document.createElement("li");\n    li.textContent = item.name + " — " + item.amount + " ";\n    const del = document.createElement("button");\n    del.className = "del";\n    del.textContent = "حذف";\n    del.onclick = () => {\n      expenses.splice(i, 1);\n      save();\n      render();\n    };\n    li.appendChild(del);\n    list.appendChild(li);\n  });\n  const sum = expenses.reduce((s, x) => s + x.amount, 0);\n  total.textContent = "المجموع: " + sum;\n}\n\ndocument.querySelector("#add").addEventListener("click", () => {\n  const name = nameEl.value.trim();\n  const amount = Number(amountEl.value);\n  if (!name || !(amount > 0)) return;\n  expenses.push({ name, amount });\n  save();\n  render();\n  nameEl.value = "";\n  amountEl.value = "";\n});\n\nrender();\n',
tests:'(function(){var N=document.getElementById("name"),A=document.getElementById("amount"),B=document.getElementById("add"),T=document.getElementById("total");if(!N||!A||!B)return;function add(n,a){N.value=n;A.value=a;B.click()}function L(){return document.querySelectorAll("#list li").length}add("خبز","10");add("مواصلات","25");add("","5");add("قهوة","0");__t(L());__t(T?T.textContent:"");var s=null;try{s=JSON.parse(localStorage.getItem("expenses")).length}catch(e){}__t(s);var d=document.querySelector("#list li .del");if(d)d.click();__t(L());__t(T?T.textContent:"");var s2=null;try{s2=JSON.parse(localStorage.getItem("expenses")).length}catch(e){}__t(s2)})();',
checks:[ok0,
['تحميل البيانات بـ getItem و JSON.parse',function(c){return /localStorage\.getItem\(\s*["\']expenses["\']/.test(c.code)&&/JSON\.parse\(/.test(c.code)}],
['بندان صحيحان يظهران، والفارغ والصفر مرفوضان',function(c){return c.t[0]===2}],
['المجموع 35',function(c){return /35/.test(T(c,1))}],
['الحفظ في localStorage كـ JSON',function(c){return c.t[2]===2}],
['زر الحذف يحذف البند ويحدّث المجموع إلى 25',function(c){return c.t[3]===1&&/25/.test(T(c,4))&&!/35/.test(T(c,4))}],
['الحذف محفوظ أيضاً',function(c){return c.t[5]===1}]]},

/* ───────── 6. مؤقّت بومودورو ───────── */
{id:'xPomo',k:'js',ic:'repeat',t:'مؤقّت بومودورو للمذاكرة',
page:'<p id="display" style="font-size:48px;font-weight:900;margin:0;direction:ltr;text-align:center">25:00</p>\n<div style="display:flex;gap:8px;justify-content:center"><button id="start">ابدأ</button><button id="pause">إيقاف</button><button id="reset">إعادة</button></div>',
g:'تبني مؤقتاً كاملاً بحالة واضحة: تشغيل وإيقاف وإعادة، دون أن يعمل مؤقتان معاً بالخطأ.',
s:['`padStart(2, "0")` تحوّل `5` إلى `"05"`.','احفظ رقم المؤقت في متغير `timer` لتوقفه بـ `clearInterval(timer)`.','`if (timer) return;` تمنع تشغيل مؤقت ثانٍ عند الضغط على "ابدأ" مرتين.'],
e:'الضغط على "ابدأ" مرتين يشغّل مؤقتين، فيتسارع العد. احرس الدالة بفحص `timer`.',
body:[
'تقنية بومودورو للمذاكرة: 25 دقيقة تركيز ثم استراحة. سنبني مؤقتها، وفيه درس مهم عن **إدارة الحالة**.',
'أولاً دالة تحويل الثواني إلى شكل الساعة "دقائق:ثوانٍ":',
{c:'function format(s) {\n  const m = Math.floor(s / 60);\n  const sec = s % 60;\n  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");\n}\nformat(65); // "01:05"'},
'الحالة متغيران: الثواني المتبقية، ورقم المؤقت (أو `null` إن كان متوقفاً):',
{c:'let seconds = 1500;\nlet timer = null;\n\nfunction start() {\n  if (timer) return; // يعمل بالفعل\n  timer = setInterval(tick, 1000);\n}\nfunction pause() {\n  clearInterval(timer);\n  timer = null;\n}'},
{tip:'كل ثانية: أنقص `seconds` واعرضها. وعند الصفر أوقف المؤقت واكتب رسالة الاستراحة.'}],
task:'اكتب `format(s)` التي تعيد "MM:SS". زر `#start` يشغّل العد التنازلي كل ثانية (ولا يشغّل مؤقتاً ثانياً)، و`#pause` يوقفه، و`#reset` يوقفه ويعيد `#display` إلى "25:00". وعند الصفر اكتب "انتهى! خذ استراحة".',
start:'const display = document.querySelector("#display");\nlet seconds = 1500;\nlet timer = null;\n\nfunction format(s) {\n  \n}\n\n',
sol:'const display = document.querySelector("#display");\nlet seconds = 1500;\nlet timer = null;\n\nfunction format(s) {\n  const m = Math.floor(s / 60);\n  const sec = s % 60;\n  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");\n}\n\nfunction tick() {\n  seconds--;\n  if (seconds <= 0) {\n    pause();\n    display.textContent = "انتهى! خذ استراحة";\n    return;\n  }\n  display.textContent = format(seconds);\n}\n\nfunction start() {\n  if (timer) return;\n  timer = setInterval(tick, 1000);\n}\n\nfunction pause() {\n  clearInterval(timer);\n  timer = null;\n}\n\nfunction reset() {\n  pause();\n  seconds = 1500;\n  display.textContent = format(seconds);\n}\n\ndocument.querySelector("#start").addEventListener("click", start);\ndocument.querySelector("#pause").addEventListener("click", pause);\ndocument.querySelector("#reset").addEventListener("click", reset);\n',
tests:'(function(){var f=typeof format==="function";__t(f?format(1500):null);__t(f?format(65):null);__t(f?format(9):null);var D=document.getElementById("display"),S=document.getElementById("start"),P=document.getElementById("pause"),R=document.getElementById("reset");if(!D||!S||!R)return;S.click();S.click();if(P)P.click();D.textContent="x";R.click();__t(D.textContent.trim())})();',
checks:[ok0,
['format(1500) تعيد "25:00"',function(c){return c.t[0]==='25:00'}],
['format(65) تعيد "01:05"',function(c){return c.t[1]==='01:05'}],
['format(9) تعيد "00:09"',function(c){return c.t[2]==='00:09'}],
['يستعمل setInterval و clearInterval',function(c){return /setInterval\(/.test(c.code)&&/clearInterval\(/.test(c.code)}],
['حارس يمنع تشغيل مؤقتين',function(c){return /if\s*\(\s*!?\s*timer\b/.test(c.code)||/timer\s*!==?\s*null/.test(c.code)}],
['"إعادة" تعرض 25:00',function(c){return c.t[3]==='25:00'}]]}
];

var quiz={
xLand:[['لماذا نضع لون الهوية في متغير `--main`؟',['لنغيّره في مكان واحد فيتغير في كل الصفحة','لأن الألوان لا تعمل دون متغير','لتسريع الصفحة'],0,'المتغير مصدر واحد للقيمة، فإذا طلب العميل لوناً آخر غيّرت سطراً واحداً.'],
['ما الذي يجعل البطاقات عموداً واحداً على الهاتف؟',['`@media (max-width: 600px)` مع `grid-template-columns: 1fr`','`display: none`','`width: 3000px`'],0,'قاعدة `@media` تطبق تنسيقاً مختلفاً حين تكون الشاشة ضيقة.']],
xBill:[['ما نتيجة `"100" + "10"` في JavaScript؟',['`"10010"`','`110`','خطأ'],0,'مع النصوص `+` تلصق ولا تجمع، لذا نحوّل بـ `Number()` أولاً.'],
['ما فائدة جعل `split()` دالة نقية لا تلمس الصفحة؟',['يسهل اختبارها وإعادة استعمالها','تعمل أسرع دائماً','لا فرق'],0,'الدالة النقية تعطي نفس النتيجة لنفس المدخلات، فتختبرها دون أي واجهة.']],
xGal:[['ماذا يعني تفويض الأحداث؟',['مستمع واحد على الأب يتعامل مع أحداث أبنائه','مستمع لكل عنصر','حذف المستمعات'],0,'الحدث يصعد من الزر إلى الأب، فيكفي مستمع واحد يعرف الزر بـ `closest`.'],
['كيف تقرأ `data-cat="food"` من عنصر؟',['`el.dataset.cat`','`el.cat`','`el.data("cat")`'],0,'كل سمة `data-xxx` تظهر في `dataset.xxx`.']],
xPass:[['ماذا تعيد `/\\d/.test("abc")`؟',['`false`','`true`','`"abc"`'],0,'`\\d` تعني رقماً، ولا يوجد رقم في "abc".'],
['أي حدث يحدّث التقييم مع كل حرف؟',['`input`','`change`','`submit`'],0,'`input` يعمل مع كل تغيير، أما `change` فبعد مغادرة الحقل.']],
xExp:[['لماذا `|| "[]"` عند التحميل؟',['لأن `getItem` تعيد `null` في أول تشغيل','لتسريع التحميل','لا ضرورة لها'],0,'لا توجد بيانات محفوظة في المرة الأولى، فنبدأ بمصفوفة فارغة بدل `null`.'],
['ما الترتيب الصحيح بعد حذف بند؟',['عدّل المصفوفة ← `save()` ← `render()`','احذف `li` فقط','`render()` ثم عدّل المصفوفة'],0,'المصفوفة مصدر الحقيقة، والصفحة تُرسم منها بعد الحفظ.']],
xPomo:[['ماذا تعيد `String(7).padStart(2, "0")`؟',['`"07"`','`"70"`','`7`'],0,'`padStart` تضيف الحرف في البداية حتى يصل الطول المطلوب.'],
['لماذا نكتب `if (timer) return;` في `start`؟',['لمنع تشغيل مؤقت ثانٍ','لإيقاف المؤقت','لا فائدة'],0,'دونها كل ضغطة تشغّل مؤقتاً جديداً، فيتسارع العد.']]
};

var extra={
xLand:'أضف قسم "آراء العملاء" فيه 3 اقتباسات، وزر "اتصل بنا" ثابتاً أسفل الشاشة على الهاتف فقط.',
xBill:'أضف خيار بقشيش مخصص يكتبه المستخدم، واعرض أيضاً قيمة البقشيش والمجموع الكلي.',
xGal:'أضف حقل بحث يعمل مع الفلتر معاً: "أكلات" + كلمة "فول" تُظهر فول فقط.',
xPass:'أضف زر "👁" يُظهر كلمة المرور ويخفيها، وقائمة شروط تتلوّن بالأخضر كلما تحقق شرط.',
xExp:'أضف تصنيفاً لكل بند (أكل، مواصلات، فواتير) واعرض مجموع كل تصنيف، وزر "مسح الكل" مع تأكيد.',
xPomo:'بعد انتهاء 25 دقيقة ابدأ استراحة 5 دقائق تلقائياً، واحسب عدد جلسات التركيز المنجزة اليوم.'
};

lessons.forEach(function(l){l.pro=1;l.q=quiz[l.id];l.x=extra[l.id]});
var unit={t:'مشاريع احترافية',d:'ستة مشاريع حقيقية لمعرض أعمالك، مع الحل النموذجي لكل مشروع',pro:1,ids:lessons.map(function(l){return l.id})};
return {lessons:lessons,unit:unit};
})();
