/* مكتبة القوالب (Snippets) في ويب نايل.
   كل قالب: {id, name, desc, prefix, lang: 'html'|'css'|'js', body, cat}
   صيغة body مثل VS Code: $1 و ${1:نص} مواضع تعديل يُتنقّل بينها بزر Tab، و $0 مكان المؤشر الأخير.
   \t في بداية السطر = مستوى إزاحة. ملاحظة: لا تكتب ${ حرفياً داخل القالب (يُفهم كموضع تعديل).
   القوالب المدمجة للقراءة فقط؛ قوالب المستخدم تُحفظ في localStorage "wn_snippets_user". */
(function(){
var B=[
// ---------- HTML ----------
['html5','هيكل صفحة HTML5','صفحة كاملة: DOCTYPE و head و body مع ربط style.css و script.js','html','هيكل',
'<!DOCTYPE html>\n<html lang="${1:ar}" dir="${2:rtl}">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1">\n\t<title>${3:صفحتي}</title>\n\t<link rel="stylesheet" href="style.css">\n</head>\n<body>\n\t$0\n\t<script src="script.js"></script>\n</body>\n</html>'],
['hp','عنوان وفقرة','h1 ثم p','html','نصوص','<h1>${1:عنوان الصفحة}</h1>\n<p>${2:اكتب هنا وصفاً قصيراً.}</p>$0'],
['btn','زر','زر بمعرّف لربطه بـ JavaScript','html','عناصر','<button id="${1:btn}">${2:اضغط هنا}</button>$0'],
['link','رابط','رابط يفتح في تبويب جديد','html','عناصر','<a href="${1:https://example.com}" target="_blank">${2:نص الرابط}</a>$0'],
['img','صورة','صورة مع وصف بديل alt','html','عناصر','<img src="${1:image.jpg}" alt="${2:وصف الصورة}">$0'],
['ul','قائمة','قائمة نقطية بثلاثة عناصر','html','عناصر','<ul>\n\t<li>${1:العنصر الأول}</li>\n\t<li>${2:العنصر الثاني}</li>\n\t<li>${3:العنصر الثالث}</li>\n</ul>$0'],
['card','بطاقة','div.card فيها عنوان ووصف','html','مكونات','<div class="${1:card}">\n\t<h3>${2:عنوان البطاقة}</h3>\n\t<p>${3:وصف قصير للبطاقة.}</p>\n</div>$0'],
['form','نموذج تسجيل','form مع حقلين وزر إرسال','html','نماذج','<form id="${1:form}">\n\t<label for="name">الاسم</label>\n\t<input id="name" placeholder="${2:اسمك}" required>\n\t<label for="email">البريد</label>\n\t<input id="email" type="email" placeholder="you@mail.com" required>\n\t<button type="submit">${3:إرسال}</button>\n</form>\n<p id="msg"></p>$0'],
['input','حقل إدخال','label و input مرتبطان','html','نماذج','<label for="${1:field}">${2:العنوان}</label>\n<input id="${1:field}" type="${3:text}" placeholder="${4}">$0'],
['table','جدول','جدول برأس وصفين','html','عناصر','<table>\n\t<thead>\n\t\t<tr><th>${1:الاسم}</th><th>${2:الدرجة}</th></tr>\n\t</thead>\n\t<tbody>\n\t\t<tr><td>${3:سارة}</td><td>${4:95}</td></tr>\n\t</tbody>\n</table>$0'],
['nav','شريط تنقل','nav فيه روابط','html','مكونات','<nav class="${1:nav}">\n\t<a href="${2:index.html}">${3:الرئيسية}</a>\n\t<a href="${4:about.html}">${5:من نحن}</a>\n\t<a href="${6:contact.html}">${7:تواصل}</a>\n</nav>$0'],
['header','رأس الصفحة','header فيه شعار وتنقل','html','مكونات','<header class="${1:site-header}">\n\t<a class="logo" href="index.html">${2:موقعي}</a>\n\t<nav>\n\t\t<a href="#${3:about}">${4:عنّا}</a>\n\t</nav>\n</header>$0'],
['section','قسم','section بعنوان','html','هيكل','<section id="${1:about}">\n\t<h2>${2:عنوان القسم}</h2>\n\t$0\n</section>'],
['footer','تذييل','footer بحقوق','html','هيكل','<footer>\n\t<p>© ${1:2026} ${2:موقعي}. جميع الحقوق محفوظة.</p>\n</footer>$0'],
['select','قائمة منسدلة','select بخيارات','html','نماذج','<select id="${1:choice}">\n\t<option value="${2:1}">${3:الخيار الأول}</option>\n\t<option value="${4:2}">${5:الخيار الثاني}</option>\n</select>$0'],
// ---------- CSS ----------
['reset','أساسيات الصفحة','box-sizing وخط وهوامش','css','أساسيات','* {\n\tbox-sizing: border-box;\n}\nbody {\n\tmargin: 0;\n\tpadding: ${1:16px};\n\tfont-family: ${2:Cairo, system-ui, sans-serif};\n\tline-height: 1.7;\n}$0'],
['vars','متغيرات الألوان',':root بمتغيرات CSS','css','أساسيات',':root {\n\t--main: ${1:#0E7C86};\n\t--bg: ${2:#F1F6F5};\n\t--text: ${3:#0B1F2A};\n}$0'],
['center','توسيط بـ Flexbox','عنصر في المنتصف أفقياً وعمودياً','css','تخطيط','.${1:center} {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tmin-height: ${2:100vh};\n}$0'],
['flex','صف Flexbox','عناصر بجانب بعض مع مسافة','css','تخطيط','.${1:row} {\n\tdisplay: flex;\n\tgap: ${2:12px};\n\talign-items: ${3:center};\n}$0'],
['grid','شبكة متجاوبة','grid auto-fit','css','تخطيط','.${1:grid} {\n\tdisplay: grid;\n\tgrid-template-columns: repeat(auto-fit, minmax(${2:160px}, 1fr));\n\tgap: ${3:12px};\n}$0'],
['button','زر جميل','زر بتأثير عند المرور','css','مكونات','${1:button} {\n\tpadding: 10px 20px;\n\tborder: 0;\n\tborder-radius: 99px;\n\tbackground: ${2:#0E7C86};\n\tcolor: white;\n\tcursor: pointer;\n\ttransition: transform .2s;\n}\n${1:button}:hover {\n\ttransform: scale(1.05);\n}$0'],
['cardcss','بطاقة بظل','.card بحواف وظل','css','مكونات','.${1:card} {\n\tpadding: 16px;\n\tborder-radius: 16px;\n\tbackground: ${2:white};\n\tbox-shadow: 0 4px 16px rgba(0, 0, 0, .08);\n}$0'],
['media','شاشات الجوال','@media للشاشات الصغيرة','css','تجاوب','@media (max-width: ${1:600px}) {\n\t${2:body} {\n\t\t$0\n\t}\n}'],
['fade','حركة ظهور','@keyframes مع class','css','حركة','@keyframes ${1:fadeIn} {\n\tfrom { opacity: 0; transform: translateY(10px); }\n\tto { opacity: 1; transform: none; }\n}\n.${2:fade} {\n\tanimation: ${1:fadeIn} ${3:.5s} ease;\n}$0'],
['dark','الوضع الداكن','prefers-color-scheme','css','تجاوب','@media (prefers-color-scheme: dark) {\n\t:root {\n\t\t--bg: ${1:#111419};\n\t\t--text: ${2:#E6E6E6};\n\t}\n}$0'],
// ---------- JavaScript ----------
['click','حدث نقر','querySelector ثم addEventListener','js','أحداث','const ${1:btn} = document.querySelector("${2:#btn}");\n${1:btn}.addEventListener("click", () => {\n\t${0:console.log("تم الضغط!");}\n});'],
['qs','اختيار عنصر','document.querySelector','js','DOM','const ${1:el} = document.querySelector("${2:.box}");$0'],
['text','تغيير نص عنصر','textContent','js','DOM','document.querySelector("${1:h1}").textContent = "${2:عنوان جديد}";$0'],
['create','إنشاء عنصر','createElement و appendChild','js','DOM','const ${1:item} = document.createElement("${2:p}");\n${1:item}.textContent = "${3:فقرة جديدة}";\n${4:document.body}.appendChild(${1:item});$0'],
['fn','دالة','function بمعامل','js','أساسيات','function ${1:greet}(${2:name}) {\n\t${0:return "أهلاً " + name;}\n}'],
['arrow','دالة سهمية','const f = () =>','js','أساسيات','const ${1:add} = (${2:a, b}) => ${3:a + b};$0'],
['foreach','حلقة على مصفوفة','forEach','js','حلقات','${1:items}.forEach((${2:item}, i) => {\n\t${0:console.log(i, item);}\n});'],
['for','حلقة for','عداد من 0','js','حلقات','for (let ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++) {\n\t$0\n}'],
['if','شرط','if / else','js','أساسيات','if (${1:score >= 50}) {\n\t${2:console.log("ناجح");}\n} else {\n\t${3:console.log("راسب");}\n}$0'],
['save','حفظ في الجهاز','localStorage مع JSON','js','تخزين','localStorage.setItem("${1:data}", JSON.stringify(${2:value}));\nconst ${3:saved} = JSON.parse(localStorage.getItem("${1:data}") || "${4:null}");$0'],
['timeout','مؤقت','setTimeout','js','وقت','setTimeout(() => {\n\t${0:console.log("بعد ثانية");}\n}, ${1:1000});'],
['submit','التحقق من نموذج','submit مع preventDefault','js','أحداث','document.querySelector("${1:#form}").addEventListener("submit", (e) => {\n\te.preventDefault();\n\tconst ${2:name} = document.querySelector("${3:#name}").value.trim();\n\t$0\n});'],
['fetch','جلب بيانات','fetch مع async/await','js','شبكة','async function ${1:load}() {\n\ttry {\n\t\tconst res = await fetch("${2:https://jsonplaceholder.typicode.com/users}");\n\t\tconst data = await res.json();\n\t\t${0:console.log(data);}\n\t} catch (e) {\n\t\tconsole.log("تعذّر الاتصال");\n\t}\n}\n${1:load}();'],
['class','صنف class','class مع constructor ودالة','js','أساسيات','class ${1:Item} {\n\tconstructor(${2:name}) {\n\t\tthis.${2:name} = ${2:name};\n\t}\n\t${3:show}() {\n\t\t$0\n\t}\n}'],
['toggle','تبديل class','classList.toggle عند النقر','js','DOM','document.querySelector("${1:#btn}").addEventListener("click", () => {\n\tdocument.querySelector("${2:.menu}").classList.toggle("${3:open}");\n});$0']
].map(function(x){return {id:'b:'+x[3]+':'+x[0],prefix:x[0],name:x[1],desc:x[2],lang:x[3],cat:x[4],body:x[5],builtin:true}});

var KEY='wn_snippets_user';
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(function(s){return s&&s.prefix&&s.body&&/^(html|css|js)$/.test(s.lang)}):[]}catch(e){return []}}
function store(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}}
window.Snips={
  builtins:B,
  custom:load,
  all:function(){return load().concat(B)},
  // قوالب المستخدم أولاً (اختصاره يغلب المدمج بنفس الاسم)
  forLang:function(lang){var seen={};return this.all().filter(function(s){if(s.lang!==lang||seen[s.prefix])return false;seen[s.prefix]=1;return true})},
  get:function(id){return this.all().find(function(s){return s.id===id})},
  save:function(sn){
    var a=load(),p=String(sn.prefix||'').trim(),body=String(sn.body||'');
    if(!/^[!\w-]{1,30}$/.test(p))return 'الاختصار حروف إنجليزية وأرقام و - فقط، دون مسافات';
    if(!body.trim())return 'اكتب محتوى القالب';
    if(!/^(html|css|js)$/.test(sn.lang))return 'اختر اللغة';
    if(a.some(function(x){return x.prefix===p&&x.lang===sn.lang&&x.id!==sn.id}))return 'لديك قالب آخر بنفس الاختصار لهذه اللغة';
    var o={id:sn.id||('u:'+Date.now().toString(36)),prefix:p,name:String(sn.name||p).trim().slice(0,60),desc:String(sn.desc||'').trim().slice(0,140),lang:sn.lang,cat:'قوالبي',body:body.slice(0,20000)};
    var i=a.findIndex(function(x){return x.id===o.id});if(i>-1)a[i]=o;else a.unshift(o);
    return store(a)?o:'تعذّر الحفظ: مساحة التخزين ممتلئة';
  },
  remove:function(id){store(load().filter(function(x){return x.id!==id}))},
  search:function(q,lang){q=String(q||'').trim().toLowerCase();return this.all().filter(function(s){return(!lang||s.lang===lang)&&(!q||(s.prefix+' '+s.name+' '+(s.desc||'')+' '+(s.cat||'')).toLowerCase().indexOf(q)>-1)})},
  preview:function(body){return String(body).replace(/\$\{\d+:([^}]*)\}/g,'$1').replace(/\$\{?\d+\}?/g,'').replace(/\t/g,'  ')}
};
})();
