/* مساحة العمل في المحرر الحر: مشاريع بمجلدات وملفات حقيقية فوق VFS (IndexedDB).
   - مستكشف ملفات (مجلدات متعددة المستويات، إنشاء/إعادة تسمية/حذف/نسخ/قص/لصق، بحث بالاسم، ترتيب)
   - تبويبات ديناميكية بمؤشر عدم الحفظ، وحفظ تلقائي، واستعادة التبويبات لكل مشروع
   - بحث واستبدال في كل ملفات المشروع
   - أصول: صور وخطوط وملفات من الجهاز تُرتّب في مجلداتها، ومعاينة الصور
   - المعاينة تجمع الصفحة مع ملفات CSS و JS والصور المرتبطة بمسارات نسبية
   - قائمة المشاريع، والحفظ في الهاتف بالمجلدات كاملة، والتصدير
   لا يحمّل محتوى أي ملف إلا عند فتحه أو البحث أو المعاينة. */
(function(){
var V=window.VFS;
var LS='wn_ws';
function lsGet(){try{return JSON.parse(localStorage.getItem(LS)||'{}')||{}}catch(e){return {}}}
function lsSet(o){try{localStorage.setItem(LS,JSON.stringify(o))}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function T(m,c){if(typeof toast==='function')toast(m,c||'')}
function pro(){return !window.Premium||Premium.active()}
var SV=function(d){return '<svg viewBox="0 0 24 24">'+d+'</svg>'};
var IC={
  folder:SV('<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>'),
  open:SV('<path d="m6 14 1.5-2.9A2 2 0 0 1 9.2 10H20a2 2 0 0 1 1.9 2.5l-1.5 6A2 2 0 0 1 18.4 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.7.9l.8 1.2a2 2 0 0 0 1.7.9H18a2 2 0 0 1 2 2v2"/>'),
  chev:SV('<path d="m9 6 6 6-6 6"/>'),
  more:SV('<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>'),
  fileNew:SV('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M15 2v5h5M12 11v6M9 14h6"/>'),
  dirNew:SV('<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2zM12 10v6M9 13h6"/>'),
  upload:SV('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>'),
  collapse:SV('<path d="m7 20 5-5 5 5M7 4l5 5 5-5"/>'),
  paste:SV('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'),
  save:SV('<path d="M12 15V3M7 10l5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>'),
  plus:SV('<path d="M12 5v14M5 12h14"/>'),
  x:SV('<path d="M18 6 6 18M6 6l12 12"/>'),
  target:SV('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
  check:SV('<path d="M20 6 9 17l-5-5"/>')
};
function ficon(p,isDir,openDir){
  if(isDir)return '<span class="wfi dir">'+(openDir?IC.open:IC.folder)+'</span>';
  var k=V.kindOf(p),F=typeof FICON!=='undefined'?FICON:{};
  return F[k]||F[V.langOf(p)]||F.txt||'';
}
function fmtSize(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(n<10240?1:0)+' KB':(n/1048576).toFixed(1)+' MB'}

/* ---------- قوالب المشاريع الجديدة ---------- */
var TPL={
  empty:{name:'فارغ',desc:'ملف index.html فقط',files:{'index.html':'<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>مشروعي</title>\n</head>\n<body>\n  \n</body>\n</html>\n'}},
  basic:{name:'أساسي',desc:'index.html + css/style.css + js/script.js',files:{
    'index.html':'<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>مشروعي</title>\n  <link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n  <h1>مشروع جديد</h1>\n  <button id="btn">اضغط</button>\n  <script src="js/script.js"></script>\n</body>\n</html>\n',
    'css/style.css':'body {\n  font-family: Cairo, system-ui, sans-serif;\n  margin: 0;\n  padding: 16px;\n}\n',
    'js/script.js':'document.querySelector("#btn").addEventListener("click", () => {\n  console.log("تم الضغط");\n});\n',
    'assets/images/.keep':''}},
  site:{name:'موقع متعدد الصفحات',desc:'صفحات ومجلدات css و js و assets',files:{
    'index.html':'<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>الرئيسية</title>\n  <link rel="stylesheet" href="css/main.css">\n</head>\n<body>\n  <nav class="nav">\n    <a href="index.html">الرئيسية</a>\n    <a href="pages/about.html">من نحن</a>\n  </nav>\n  <main>\n    <h1>الصفحة الرئيسية</h1>\n  </main>\n  <script src="js/app.js"></script>\n</body>\n</html>\n',
    'pages/about.html':'<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>من نحن</title>\n  <link rel="stylesheet" href="../css/main.css">\n</head>\n<body>\n  <nav class="nav">\n    <a href="../index.html">الرئيسية</a>\n    <a href="about.html">من نحن</a>\n  </nav>\n  <main>\n    <h1>من نحن</h1>\n  </main>\n  <script src="../js/app.js"></script>\n</body>\n</html>\n',
    'css/main.css':':root {\n  --main: #0E7C86;\n}\nbody {\n  margin: 0;\n  font-family: Cairo, system-ui, sans-serif;\n}\n.nav {\n  display: flex;\n  gap: 16px;\n  padding: 12px 16px;\n  background: var(--main);\n}\n.nav a {\n  color: white;\n}\nmain {\n  padding: 16px;\n}\n',
    'js/app.js':'console.log("الموقع جاهز");\n',
    'assets/images/.keep':'','data/.keep':''}}
};

/* ---------- الحالة ---------- */
var W={pid:null,name:'',items:[],map:{},expanded:{},tabs:[],active:null,dirty:{},saving:{},clip:null,E:null,filter:'',q:null,dataCache:{}};
function st(){var o=lsGet();o.tabs=o.tabs||{};return o}
function saveState(){
  if(!W.pid)return;var o=st();o.pid=W.pid;
  o.tabs[W.pid]={open:W.tabs,active:W.active,expanded:Object.keys(W.expanded).filter(function(k){return W.expanded[k]})};
  lsSet(o);
}
function refreshList(){
  return V.list(W.pid).then(function(a){
    W.items=a.filter(function(f){return V.basename(f.path)!=='.keep'});
    W.map={};a.forEach(function(f){W.map[f.path]=f});
    try{localStorage.setItem('wn_ws_count',String(W.projectsCount||1))}catch(e){}
  });
}

/* ---------- الترحيل من النسخ السابقة (مرة واحدة) ---------- */
function migrate(){
  return V.meta('migrated').then(function(done){
    if(done)return;
    return V.projects().then(function(ps){
      if(ps.length)return V.meta('migrated',1);
      function g(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
      var html=g('webnile_play','<h1>أهلاً بك</h1>\n<p>جرّب أي كود HTML هنا، والتنسيق في style.css، والبرمجة في script.js.</p>\n<button id="btn">اضغط</button>');
      var css=g('webnile_play_css','body {\n  font-family: Cairo, sans-serif;\n}\n'),js=g('webnile_play_js','// اكتب JavaScript هنا\n');
      // التجربة الحرة القديمة كانت تحقن style.css و script.js تلقائياً: نضيف الربط صراحة ليبقى السلوك نفسه
      var page=/<html[\s>]/i.test(html)?html:html+'\n';
      if(!/style\.css/.test(page))page='<link rel="stylesheet" href="style.css">\n'+page;
      if(!/script\.js/.test(page))page=page+'<script src="script.js"></script>\n';
      var jobs=[V.createProject('مشروعي',{'index.html':page,'style.css':css,'script.js':js})];
      var old=[];try{old=JSON.parse(g('webnile_projects','[]'))||[]}catch(e){}
      old.forEach(function(p){
        var h=p.html||'';if(!/style\.css/.test(h))h='<link rel="stylesheet" href="style.css">\n'+h;if(!/script\.js/.test(h))h+='\n<script src="script.js"></script>\n';
        jobs.push(V.createProject(p.name||'مشروع',{'index.html':h,'style.css':p.css||'','script.js':p.js||''}));
      });
      return Promise.all(jobs).then(function(ids){var o=st();o.pid=ids[0];lsSet(o);return V.meta('migrated',1)});
    });
  });
}

/* ---------- تحميل مشروع ---------- */
function load(){
  V.persist();
  return migrate().then(function(){return V.projects()}).then(function(ps){
    W.projectsCount=ps.length;
    var o=st(),p=ps.find(function(x){return x.id===o.pid})||ps[0];
    if(!p)return V.createProject('مشروعي',TPL.basic.files).then(function(id){return V.project(id)});
    return p;
  }).then(function(p){
    W.pid=p.id;W.name=p.name;W.dirty={};W.dataCache={};
    return refreshList();
  }).then(function(){
    var s=(st().tabs||{})[W.pid]||{};
    W.expanded={};(s.expanded||[]).forEach(function(k){W.expanded[k]=1});
    var open=(s.open||[]).filter(function(p){return W.map[p]&&V.isText(p)});
    if(!open.length){var first=['index.html'].concat(W.items.map(function(f){return f.path})).find(function(p){return W.map[p]&&W.map[p].type==='file'&&V.isText(p)});if(first)open=[first]}
    if(!open.length)return V.write(W.pid,'index.html',TPL.empty.files['index.html']).then(function(){return refreshList()}).then(function(){return ['index.html']});
    return open;
  }).then(function(open){
    W.tabs=open.slice(0,12);
    W.active=W.tabs.indexOf((st().tabs[W.pid]||{}).active)>-1?st().tabs[W.pid].active:W.tabs[0];
    return Promise.all(W.tabs.map(function(p){return V.read(W.pid,p)}));
  }).then(function(texts){
    // الملف النشط أولاً حتى يفتحه المحرر
    var files=W.tabs.map(function(p,i){return {key:p,name:V.basename(p),lang:V.langOf(p)||'txt',doc:String(texts[i]||'')}});
    files.sort(function(a,b){return (b.key===W.active)-(a.key===W.active)});
    var order=W.tabs.slice();
    return {files:files,order:order};
  });
}

/* ---------- ربط المحرر ---------- */
var saveT={};
function attach(E,order){
  W.E=E;var cm=E.cm;
  // ترتيب التبويبات كما كان
  W.tabs=order;
  renderTabs();
  E.ed.addEventListener('input',function(){var k=cm.current;if(!k)return;W.dirty[k]=1;markTab(k);clearTimeout(saveT[k]);saveT[k]=setTimeout(function(){saveFile(k)},600)});
  document.querySelector('#ftabs').addEventListener('click',onTabClick,true);
  renderTree();renderProjects();renderSearch();
  var dr=document.querySelector('#xdrawer');
  dr.querySelector('.xpanes').addEventListener('click',onDrawerClick);
  dr.querySelector('.xpanes').addEventListener('input',onDrawerInput);
  dr.querySelector('.xpanes').addEventListener('contextmenu',onLongPress);
  document.querySelector('#ftabs').addEventListener('contextmenu',onLongPress);
  // حفظ فوري عند مغادرة التطبيق أو إغلاقه
  document.addEventListener('visibilitychange',flushIfHidden);
  window.addEventListener('pagehide',flush);
  try{var A=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.App;if(A&&!W._pause){W._pause=1;A.addListener('pause',flush)}}catch(e){}
  window._wsFlush=flush;
}
function flushIfHidden(){if(document.visibilityState==='hidden')flush()}
function flush(){Object.keys(W.dirty).forEach(function(k){clearTimeout(saveT[k]);saveFile(k)})}
function saveFile(k){
  if(!W.E||!W.dirty[k])return Promise.resolve();
  var text=W.E.cm.get(k),pid=W.pid;
  W.saving[k]=1;
  return V.write(pid,k,text).then(function(){
    if(pid!==W.pid)return;
    if(W.E.cm.get(k)===text)delete W.dirty[k];
    delete W.saving[k];markTab(k);
    var f=W.map[k];if(f){f.size=text.length;f.mtime=Date.now()}
  }).catch(function(e){delete W.saving[k];T('لم يُحفظ '+V.basename(k)+': '+e.message,'bad')});
}
function detach(){
  flush();
  document.removeEventListener('visibilitychange',flushIfHidden);
  window.removeEventListener('pagehide',flush);
  W.E=null;
}

/* ---------- التبويبات ---------- */
function tabHTML(p){
  var lang=V.langOf(p)||'txt';
  return '<button data-f="'+esc(p)+'" class="ft '+lang+(p===W.active?' on':'')+(W.dirty[p]?' dirty':'')+'" title="'+esc(p)+'"><i></i>'+esc(V.basename(p))+'<span class="ftx" data-close="'+esc(p)+'" aria-label="إغلاق">×</span></button>';
}
function renderTabs(){var b=document.querySelector('#ftabs');if(b)b.innerHTML=W.tabs.map(tabHTML).join('');var a=b&&b.querySelector('.on');if(a)a.scrollIntoView({inline:'nearest',block:'nearest'})}
function markTab(k){var b=document.querySelector('#ftabs [data-f="'+cssq(k)+'"]');if(b)b.classList.toggle('dirty',!!W.dirty[k])}
function cssq(s){return String(s).replace(/["\\]/g,'\\$&')}
function onTabClick(e){
  var x=e.target.closest('[data-close]');
  if(x){e.preventDefault();e.stopPropagation();closeTab(x.dataset.close);return}
  var b=e.target.closest('[data-f]');if(b){W.active=b.dataset.f;saveState();setTimeout(syncTree)}
}
function openFile(p){
  if(!W.E)return Promise.resolve();
  p=V.norm(p);
  if(!V.isText(p)){return previewAsset(p)}
  var cm=W.E.cm;
  if(W.tabs.indexOf(p)>-1){activate(p);return Promise.resolve()}
  return V.read(W.pid,p).then(function(t){
    if(t==null){T('الملف غير موجود','bad');return}
    cm.addFile(W.E.mk({key:p,name:V.basename(p),lang:V.langOf(p)||'txt',doc:String(t)}));
    W.tabs.push(p);
    if(W.tabs.length>12){var old=W.tabs.find(function(x){return x!==p&&!W.dirty[x]});if(old)closeTab(old,true)}
    activate(p);
  });
}
function activate(p){
  W.active=p;renderTabs();
  var t=document.querySelector('#ftabs [data-f="'+cssq(p)+'"]');if(t)t.click();
  saveState();syncTree();
}
function closeTab(p,silent){
  var cm=W.E.cm;
  if(W.tabs.length<2){if(!silent)T('يبقى ملف واحد مفتوحاً على الأقل');return}
  var go=function(){
    cm.removeFile(p);
    W.tabs=W.tabs.filter(function(x){return x!==p});
    if(W.active===p)W.active=cm.current;
    renderTabs();var t=document.querySelector('#ftabs .ft.on');if(t)t.click();saveState();
  };
  if(W.dirty[p]){clearTimeout(saveT[p]);saveFile(p).then(go)}else go();
}

// إغلاق عدة تبويبات: نحفظ المعدَّل أولاً، ويبقى تبويب واحد على الأقل
function closeMany(list){
  return Promise.all(list.filter(function(t){return W.dirty[t]}).map(function(t){clearTimeout(saveT[t]);return saveFile(t)})).then(function(){
    list.forEach(function(t){if(!W.dirty[t]&&W.tabs.indexOf(t)>-1)closeTab(t,true)});
  });
}
function tabMenu(p){
  var i=W.tabs.indexOf(p),items=[{id:'close',label:'إغلاق'}];
  if(W.tabs.length>1)items.push({id:'others',label:'إغلاق الباقي'},{id:'all',label:'إغلاق الكل (يبقى الملف الحالي)'});
  if(i>-1&&i<W.tabs.length-1)items.push({id:'right',label:'إغلاق التبويبات التالية'});
  items.push(null,{id:'reveal',label:'إظهاره في شجرة الملفات'},{id:'rename',label:'إعادة تسمية'});
  return menu(p,items).then(function(a){
    if(a==='close')return closeTab(p);
    if(a==='others')return openFile(p).then(function(){return closeMany(W.tabs.filter(function(t){return t!==p}))});
    if(a==='all')return closeMany(W.tabs.filter(function(t){return t!==W.active}));
    if(a==='right'){var r=W.tabs.slice(i+1);return (r.indexOf(W.active)>-1?openFile(p):Promise.resolve()).then(function(){return closeMany(r)})}
    if(a==='reveal')return reveal(p);
    if(a==='rename')return rename(p);
  });
}
// يفتح اللوحة على مجلد الملف ويمرّر إليه
function reveal(p){
  if(!p||!W.map[p])return;
  W.filter='';
  var d=V.dirname(p);while(d){W.expanded[d]=1;d=V.dirname(d)}
  saveState();renderTree();
  var dr=document.querySelector('#xdrawer'),b=dr.querySelector('[data-p=files]');
  if(!dr.classList.contains('open'))document.querySelector('[data-x=menu]').click();
  if(b)b.click();
  setTimeout(function(){var r=dr.querySelector('#wsx .wrow[data-path="'+cssq(p)+'"]');if(r){r.scrollIntoView({block:'center'});r.classList.add('flash');setTimeout(function(){r.classList.remove('flash')},1200)}},60);
}
/* ملف التشغيل الافتراضي لكل مشروع */
function getLaunch(){var p=(lsGet().launch||{})[W.pid];return p&&W.map[p]&&V.langOf(p)==='html'?p:null}
function setLaunch(p){var o=lsGet();o.launch=o.launch||{};if(p)o.launch[W.pid]=p;else delete o.launch[W.pid];lsSet(o);renderTree()}
// الضغط المطوّل على ملف أو تبويب يفتح قائمته
function onLongPress(e){
  var t=e.target.closest('#ftabs [data-f]');
  if(t){e.preventDefault();return tabMenu(t.dataset.f)}
  var r=e.target.closest('#wsx .wrow[data-path]');
  if(r){e.preventDefault();return itemMenu(r.dataset.path)}
}

/* ---------- شجرة الملفات ---------- */
function children(dir){
  var pre=dir?dir+'/':'';
  return W.items.filter(function(f){return f.path.indexOf(pre)===0&&f.path.slice(pre.length).indexOf('/')<0&&f.path!==dir})
    .sort(function(a,b){return (a.type==='dir'?0:1)-(b.type==='dir'?0:1)||a.path.localeCompare(b.path,'en',{numeric:true,sensitivity:'base'})});
}
function rowHTML(f,depth){
  var name=V.basename(f.path),isDir=f.type==='dir',open=!!W.expanded[f.path];
  return '<div class="wrow'+(isDir?' wdir':'')+(f.path===W.active?' on':'')+(W.clip&&W.clip.op==='cut'&&W.clip.path===f.path?' cut':'')+'" style="--d:'+depth+'" data-path="'+esc(f.path)+'">'+
    '<button class="wmain" data-open="'+esc(f.path)+'">'+(isDir?'<span class="wch'+(open?' o':'')+'">'+IC.chev+'</span>':'<span class="wch"></span>')+ficon(f.path,isDir,open)+'<span class="wn">'+esc(name)+'</span>'+(isDir?'':'<small>'+(f.path===getLaunch()?'<em class="wrun" title="ملف التشغيل">▶</em>':'')+(W.dirty[f.path]?'●':'')+'</small>')+'</button>'+
    '<button class="wmore" data-menu="'+esc(f.path)+'" aria-label="خيارات">'+IC.more+'</button></div>';
}
function tree(dir,depth){
  return children(dir).map(function(f){
    var h=rowHTML(f,depth);
    if(f.type==='dir'&&W.expanded[f.path])h+=tree(f.path,depth+1);
    return h;
  }).join('');
}
function filtered(){
  var q=W.filter.toLowerCase();
  return W.items.filter(function(f){return f.type==='file'&&V.basename(f.path)!=='.keep'&&f.path.toLowerCase().indexOf(q)>-1}).sort(function(a,b){return a.path.localeCompare(b.path)})
    .map(function(f){return '<div class="wrow'+(f.path===W.active?' on':'')+'" style="--d:0" data-path="'+esc(f.path)+'"><button class="wmain" data-open="'+esc(f.path)+'"><span class="wch"></span>'+ficon(f.path)+'<span class="wn">'+esc(V.basename(f.path))+'<em>'+esc(V.dirname(f.path))+'</em></span></button><button class="wmore" data-menu="'+esc(f.path)+'" aria-label="خيارات">'+IC.more+'</button></div>'}).join('')||'<p class="wempty">لا يوجد ملف بهذا الاسم</p>';
}
function renderTree(){
  var box=document.querySelector('#wsx');if(!box)return;
  var focused=document.activeElement&&document.activeElement.id==='ws-filter',pos=focused?document.activeElement.selectionStart:0;
  box.innerHTML='<div class="xph"><span title="'+esc(W.name)+'">'+esc(W.name)+'</span>'+
    '<button class="xph-i" data-ws="newfile" aria-label="ملف جديد">'+IC.fileNew+'</button><button class="xph-i" data-ws="newdir" aria-label="مجلد جديد">'+IC.dirNew+'</button>'+
    '<button class="xph-i" data-ws="upload" aria-label="إضافة ملفات من الجهاز">'+IC.upload+'</button><button class="xph-i" data-ws="collapse" aria-label="طي الكل">'+IC.collapse+'</button>'+
    '<button class="xph-i" data-ws="locate" aria-label="تحديد الملف المفتوح">'+IC.target+'</button></div>'+
    '<div class="wfil"><input id="ws-filter" type="search" dir="auto" placeholder="ابحث عن ملف بالاسم…" value="'+esc(W.filter)+'"></div>'+
    (W.clip?'<div class="wclip">'+IC.paste+'<span>'+(W.clip.op==='cut'?'نقل':'نسخ')+': <b dir="ltr">'+esc(V.basename(W.clip.path))+'</b></span><button data-ws="paste" data-dir="">لصق في الجذر</button><button data-ws="clipx" aria-label="إلغاء">'+IC.x+'</button></div>':'')+
    '<div class="wtree" dir="ltr">'+(W.filter?filtered():tree('',0)||'<p class="wempty">المشروع فارغ</p>')+'</div>'+
    '<div class="xph"><span>DEVICE</span>'+(pro()?'':'<em class="xpro">PRO</em>')+'</div>'+
    '<button class="xrow" data-ws="devsave">'+IC.save+'<span>حفظ المشروع في الهاتف</span></button>';
  if(focused){var i=box.querySelector('#ws-filter');i.focus();try{i.setSelectionRange(pos,pos)}catch(e){}}
}
function syncTree(){document.querySelectorAll('#wsx .wrow').forEach(function(r){r.classList.toggle('on',r.dataset.path===W.active)})}

/* ---------- نوافذ صغيرة (بدل prompt و confirm) ---------- */
function sheet(html){
  var host=document.querySelector('.xide')||document.body;
  var o=document.createElement('div');o.className='wsheet';o.innerHTML='<div class="wsbox" role="dialog">'+html+'</div>';
  host.appendChild(o);requestAnimationFrame(function(){o.classList.add('show')});
  o.close=function(){o.classList.remove('show');setTimeout(function(){o.remove()},200)};
  o.addEventListener('click',function(e){if(e.target===o)o.close()});
  return o;
}
function ask(title,value,hint,okText){
  return new Promise(function(ok){
    var o=sheet('<b>'+esc(title)+'</b>'+(hint?'<small>'+esc(hint)+'</small>':'')+'<input class="wsin" dir="auto" value="'+esc(value||'')+'" autocapitalize="off" autocorrect="off" spellcheck="false"><div class="wsact"><button data-a="ok" class="ok">'+esc(okText||'تم')+'</button><button data-a="no">إلغاء</button></div>');
    var i=o.querySelector('input');setTimeout(function(){i.focus();var d=i.value.lastIndexOf('.');i.setSelectionRange(0,d>0?d:i.value.length)},120);
    var done=function(v){o.close();ok(v)};
    i.addEventListener('keydown',function(e){if(e.key==='Enter')done(i.value.trim());if(e.key==='Escape')done(null)});
    o.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(b)done(b.dataset.a==='ok'?i.value.trim():null)});
    o.addEventListener('click',function(e){if(e.target===o)ok(null)});
  });
}
function confirmBox(title,msg,okText){
  return new Promise(function(ok){
    var o=sheet('<b>'+esc(title)+'</b><small>'+esc(msg)+'</small><div class="wsact"><button data-a="ok" class="del">'+esc(okText||'حذف')+'</button><button data-a="no">إلغاء</button></div>');
    o.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(b){o.close();ok(b.dataset.a==='ok')}else if(e.target===o)ok(false)});
  });
}
function menu(title,items){
  return new Promise(function(ok){
    var o=sheet('<b dir="auto">'+esc(title)+'</b><div class="wsmenu">'+items.map(function(x,i){return x?'<button data-i="'+i+'"'+(x.danger?' class="del"':'')+'>'+esc(x.label)+'</button>':'<hr>'}).join('')+'</div>');
    o.addEventListener('click',function(e){var b=e.target.closest('[data-i]');if(b){o.close();ok(items[+b.dataset.i].id)}else if(e.target===o)ok(null)});
  });
}

/* ---------- عمليات الملفات ---------- */
function after(p){return refreshList().then(function(){renderTree();if(p){var d=V.dirname(p);while(d){W.expanded[d]=1;d=V.dirname(d)}renderTree();saveState()}})}
function fail(e){T(e.message||String(e),'bad')}
function newItem(dir,isDir){
  return ask(isDir?'مجلد جديد':'ملف جديد',isDir?'':'',dir?'داخل: '+dir+'/':'في جذر المشروع. يمكنك كتابة مسار مثل css/main.css').then(function(n){
    if(!n)return;
    var parts=V.norm(n).split('/');for(var i=0;i<parts.length;i++){var er=V.checkName(parts[i]);if(er)return T(er,'bad')}
    var p=V.join(dir,n);
    if(W.map[p])return T('يوجد عنصر بهذا الاسم','bad');
    if(isDir)return V.mkdir(W.pid,p).then(function(){W.expanded[p]=1;return after(p)}).catch(fail);
    if(!V.isText(p))return T('أنشئ ملفات نصية فقط (html، css، js، json، md، txt). الصور والخطوط أضفها من زر الرفع','bad');
    var init=V.langOf(p)==='html'?TPL.empty.files['index.html'].replace('مشروعي',V.basename(p).replace(/\.\w+$/,'')):'';
    return V.write(W.pid,p,init).then(function(){return after(p)}).then(function(){return openFile(p)}).then(function(){document.querySelector('#xdrawer').classList.remove('open')}).catch(fail);
  });
}
function rename(p){
  var f=W.map[p];if(!f)return;
  return ask('إعادة تسمية',V.basename(p)).then(function(n){
    if(!n||n===V.basename(p))return;
    var er=V.checkName(n);if(er)return T(er,'bad');
    var to=V.join(V.dirname(p),n);
    return Promise.resolve(W.dirty[p]?saveFile(p):0).then(function(){return V.move(W.pid,p,to)}).then(function(){retab(p,to);return after(to)}).then(function(){T('أُعيدت التسمية','good')}).catch(fail);
  });
}
// تحديث التبويبات المفتوحة بعد نقل أو إعادة تسمية ملف أو مجلد
function retab(from,to){
  var lp=(lsGet().launch||{})[W.pid];
  if(lp&&(lp===from||lp.indexOf(from+'/')===0)){var o=lsGet();o.launch[W.pid]=to+lp.slice(from.length);lsSet(o)}
  var cm=W.E&&W.E.cm;if(!cm)return;
  W.tabs=W.tabs.map(function(t){
    if(t===from||t.indexOf(from+'/')===0){var n=to+t.slice(from.length);cm.renameFile(t,n,V.basename(n),V.langOf(n)||'txt');if(W.active===t)W.active=n;if(W.dirty[t]){W.dirty[n]=1;delete W.dirty[t]}return n}
    return t;
  });
  renderTabs();saveState();
  var on=document.querySelector('#ftabs .ft.on');if(on)on.click();
}
function del(p){
  var f=W.map[p];if(!f)return;
  var n=f.type==='dir'?W.items.filter(function(x){return x.type==='file'&&x.path.indexOf(p+'/')===0}).length:0;
  return confirmBox('حذف "'+V.basename(p)+'"؟',f.type==='dir'?'سيُحذف المجلد وكل ما فيه ('+n+' ملف). لا يمكن التراجع.':'لا يمكن التراجع عن الحذف.').then(function(yes){
    if(!yes)return;
    var gone=function(t){return t===p||t.indexOf(p+'/')===0};
    var open=W.tabs.filter(gone),pre=Promise.resolve();
    // لو كانت كل التبويبات المفتوحة ضمن المحذوف نفتح ملفاً آخر أولاً (يبقى تبويب واحد على الأقل)
    if(open.length&&open.length>=W.tabs.length){
      var other=W.items.find(function(x){return x.type==='file'&&!gone(x.path)&&V.isText(x.path)&&V.basename(x.path)!=='.keep'});
      if(!other)return T('هذا آخر ملف نصي في المشروع. أنشئ ملفاً آخر أولاً','bad');
      pre=openFile(other.path);
    }
    return pre.then(function(){
      open.forEach(function(t){delete W.dirty[t];clearTimeout(saveT[t]);closeTab(t,true)});
      return V.remove(W.pid,p);
    }).then(function(){if(W.clip&&W.clip.path===p)W.clip=null;return after()}).then(function(){T('حُذف')}).catch(fail);
  });
}
function paste(dir){
  if(!W.clip)return;
  var c=W.clip,name=V.basename(c.path);
  if(c.op==='cut'&&V.dirname(c.path)===dir){W.clip=null;return renderTree()}
  var go=c.op==='copy'?V.freeName(W.pid,dir,name).then(function(to){return V.copy(W.pid,c.path,to)}):V.move(W.pid,c.path,V.join(dir,name));
  return Promise.resolve(W.dirty[c.path]?saveFile(c.path):0).then(function(){return go}).then(function(to){if(c.op==='cut')retab(c.path,to);W.clip=null;if(dir)W.expanded[dir]=1;return after(to)}).then(function(){T(c.op==='cut'?'نُقل':'نُسخ','good')}).catch(fail);
}
function itemMenu(p){
  var f=W.map[p];if(!f)return;
  var isDir=f.type==='dir',items=[];
  if(!isDir)items.push({id:'open',label:V.isText(p)?'فتح':'معاينة'});
  if(isDir)items.push({id:'newfile',label:'ملف جديد هنا'},{id:'newdir',label:'مجلد جديد هنا'},{id:'upload',label:'رفع ملفات من الجهاز هنا'});
  if(!isDir&&V.kindOf(p)==='image'||!isDir&&V.isText(p))items.push({id:'path',label:'إدراج مساره في الملف المفتوح'});
  if(!isDir&&V.langOf(p)==='html')items.push(getLaunch()===p?{id:'unlaunch',label:'إلغاء تعيينه ملفَّ التشغيل'}:{id:'launch',label:'تعيينه ملفَّ التشغيل'});
  items.push(null,{id:'rename',label:'إعادة تسمية'},{id:'copy',label:'نسخ'},{id:'cut',label:'قص (للنقل)'});
  if(isDir&&W.clip)items.push({id:'paste',label:'لصق هنا: '+V.basename(W.clip.path)});
  items.push(null,{id:'del',label:'حذف',danger:true});
  return menu(p,items).then(function(a){
    if(a==='open')return openFile(p).then(closeDrawerIfText(p));
    if(a==='launch'){setLaunch(p);return T('زر التشغيل سيفتح '+V.basename(p),'good')}
    if(a==='unlaunch')return setLaunch(null);
    if(a==='newfile')return newItem(p,false);
    if(a==='newdir')return newItem(p,true);
    if(a==='upload')return upload(p);
    if(a==='path')return insertPath(p);
    if(a==='rename')return rename(p);
    if(a==='copy'||a==='cut'){W.clip={op:a,path:p};renderTree();T(a==='cut'?'اختر المجلد ثم "لصق هنا"':'نُسخ. اختر مكان اللصق');return}
    if(a==='paste')return paste(p);
    if(a==='del')return del(p);
  });
}
function closeDrawerIfText(p){return function(){if(V.isText(p))document.querySelector('#xdrawer').classList.remove('open')}}
// مسار نسبي من ملف إلى آخر (للروابط و src)
function relPath(fromFile,to){
  var a=V.dirname(fromFile).split('/').filter(Boolean),b=to.split('/');
  while(a.length&&b.length>1&&a[0]===b[0]){a.shift();b.shift()}
  return a.map(function(){return '..'}).concat(b).join('/');
}
function insertPath(p){
  if(!W.E)return;var cm=W.E.cm,cur=cm.current,rel=relPath(cur,p),L=cm.lang,k=V.kindOf(p),txt;
  if(L==='html')txt=k==='image'?'<img src="'+rel+'" alt="">':k==='css'?'<link rel="stylesheet" href="'+rel+'">':k==='js'?'<script src="'+rel+'"></script>':'<a href="'+rel+'">'+V.basename(p)+'</a>';
  else if(L==='css')txt=k==='font'?'@font-face {\n  font-family: "MyFont";\n  src: url("'+rel+'");\n}':'url("'+rel+'")';
  else txt='"'+rel+'"';
  document.querySelector('#xdrawer').classList.remove('open');
  cm.type(txt);T('أُدرج: '+rel,'good');
}

/* ---------- الأصول: رفع من الجهاز ---------- */
function routeDir(name){
  var k=V.kindOf(name);
  return k==='image'?'assets/images':k==='font'?'assets/fonts':k==='media'?'assets/media':k==='css'?'css':k==='js'?'js':k==='json'?'data':'';
}
var MAX=5*1048576;
function upload(dir){
  if(!pro())return Premium.paywall('storage');
  var inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.style.display='none';document.body.appendChild(inp);
  inp.onchange=function(){
    var fl=[].slice.call(inp.files||[]);inp.remove();if(!fl.length)return;
    var added=[];
    fl.reduce(function(pr,f){return pr.then(function(){
      if(f.size>MAX){T(f.name+' أكبر من 5MB','bad');return}
      var er=V.checkName(f.name);if(er){T(f.name+': '+er,'bad');return}
      var d=dir!=null?dir:routeDir(f.name);
      return V.freeName(W.pid,d,f.name).then(function(p){
        var c=V.isText(f.name)?f.text():Promise.resolve(f.slice(0,f.size,f.type||V.mimeOf(f.name)));
        return c.then(function(content){return V.write(W.pid,p,content)}).then(function(){added.push(p)});
      });
    })},Promise.resolve()).then(function(){
      if(!added.length)return;
      return after(added[0]).then(function(){T('أُضيف: '+added.map(V.basename).join('، '),'good')});
    }).catch(fail);
  };
  inp.click();
}
function dataURL(p){
  var f=W.map[p];if(!f)return Promise.resolve(null);
  var key=p+'@'+f.mtime;if(W.dataCache[key])return Promise.resolve(W.dataCache[key]);
  return V.read(W.pid,p).then(function(c){
    if(c==null)return null;
    var blob=c instanceof Blob?c:new Blob([c],{type:V.mimeOf(p)});
    return new Promise(function(ok){var r=new FileReader();r.onload=function(){W.dataCache[key]=r.result;ok(r.result)};r.onerror=function(){ok(null)};r.readAsDataURL(blob)});
  });
}
function previewAsset(p){
  var f=W.map[p]||{},k=V.kindOf(p);
  return dataURL(p).then(function(url){
    var o=sheet('<b dir="ltr">'+esc(p)+'</b><small>'+fmtSize(f.size||0)+'</small>'+
      (k==='image'&&url?'<div class="wimg"><img src="'+url+'" alt=""></div>':k==='font'?'<small>ملف خط. استعمله في CSS عبر @font-face</small>':'<small>ملف ثنائي لا يُفتح في المحرر</small>')+
      '<div class="wsact"><button data-a="ins" class="ok">إدراج المسار في الكود</button><button data-a="no">إغلاق</button></div>');
    o.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;o.close();if(b.dataset.a==='ins')insertPath(p)});
  });
}

/* ---------- البحث الشامل ---------- */
W.q={text:'',rep:'',cs:false,re:false,word:false,ex:'assets, node_modules',res:null,busy:false};
function renderSearch(){
  var box=document.querySelector('#wss');if(!box)return;
  var q=W.q;
  box.innerHTML='<div class="xph"><span>SEARCH</span></div>'+
    '<div class="wsq"><input id="wsq-t" type="search" dir="auto" placeholder="ابحث في كل ملفات المشروع" value="'+esc(q.text)+'">'+
    '<div class="wsopt" dir="ltr"><button data-q="cs" class="'+(q.cs?'on':'')+'" title="حالة الأحرف">Aa</button><button data-q="word" class="'+(q.word?'on':'')+'" title="كلمة كاملة">ab</button><button data-q="re" class="'+(q.re?'on':'')+'" title="تعبير نمطي">.*</button></div>'+
    '<input id="wsq-r" dir="auto" placeholder="استبدال بـ (اختياري)" value="'+esc(q.rep)+'">'+
    '<input id="wsq-x" dir="ltr" placeholder="استثناء مجلدات" value="'+esc(q.ex)+'">'+
    '<div class="wsact"><button data-q="go" class="ok">بحث</button><button data-q="all"'+(q.res&&q.res.n?'':' disabled')+'>استبدال الكل</button></div></div>'+
    '<div class="wsres" id="wsres">'+resultsHTML()+'</div>';
}
function rx(){
  var q=W.q,src=q.re?q.text:q.text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(q.word)src='\\b'+src+'\\b';
  return new RegExp(src,'g'+(q.cs?'':'i'));
}
function textOf(p){return W.tabs.indexOf(p)>-1&&W.E?Promise.resolve(W.E.cm.get(p)):V.read(W.pid,p).then(function(t){return typeof t==='string'?t:''})}
function runSearch(){
  var q=W.q;if(!q.text){q.res=null;return renderSearch()}
  var re;try{re=rx()}catch(e){return T('التعبير النمطي غير صالح','bad')}
  var ex=q.ex.split(',').map(function(s){return V.norm(s.trim())}).filter(Boolean);
  var files=W.items.filter(function(f){return f.type==='file'&&V.isText(f.path)&&!ex.some(function(x){return f.path===x||f.path.indexOf(x+'/')===0})});
  q.busy=true;
  return Promise.all(files.map(function(f){return textOf(f.path).then(function(t){return [f.path,t]})})).then(function(all){
    var groups=[],n=0;
    all.forEach(function(pt){
      var p=pt[0],t=pt[1],hits=[],m;re.lastIndex=0;
      while((m=re.exec(t))&&n<1000){
        if(!m[0].length){re.lastIndex++;continue}
        var ls=t.lastIndexOf('\n',m.index-1)+1,le=t.indexOf('\n',m.index);if(le<0)le=t.length;
        hits.push({from:m.index,to:m.index+m[0].length,line:t.slice(0,m.index).split('\n').length,pre:t.slice(Math.max(ls,m.index-40),m.index),hit:m[0],post:t.slice(m.index+m[0].length,Math.min(le,m.index+m[0].length+60))});n++;
      }
      if(hits.length)groups.push({path:p,hits:hits});
    });
    q.res={groups:groups,n:n,files:files.length};q.busy=false;renderSearch();
  });
}
function resultsHTML(){
  var r=W.q.res;if(!r)return '<p class="wempty">اكتب نصاً ثم اضغط بحث. يبحث في كل الملفات النصية ما عدا المستثناة.</p>';
  if(!r.n)return '<p class="wempty">لا نتائج في '+r.files+' ملف</p>';
  return '<p class="wsum">'+r.n+(r.n>=1000?'+':'')+' نتيجة في '+r.groups.length+' ملف</p>'+r.groups.map(function(g,gi){
    return '<div class="wsg"><div class="wsgh" dir="ltr">'+ficon(g.path)+'<b>'+esc(V.basename(g.path))+'</b><small>'+esc(V.dirname(g.path))+'</small><i>'+g.hits.length+'</i></div>'+
      g.hits.slice(0,200).map(function(h,hi){return '<div class="wsh"><button data-hit="'+gi+':'+hi+'" dir="ltr"><small>'+h.line+'</small><code>'+esc(h.pre)+'<mark>'+esc(h.hit)+'</mark>'+esc(h.post)+'</code></button>'+(W.q.rep||W.q.rep===''?'<button class="wsr" data-rep="'+gi+':'+hi+'" aria-label="استبدال هذه">'+IC.check+'</button>':'')+'</div>'}).join('')+'</div>';
  }).join('');
}
function replaceIn(p,ranges){
  // ranges: [{from,to}] من نفس الملف، تُستبدل من الآخر للأول
  return textOf(p).then(function(t){
    var q=W.q,re=rx(),out=t;
    ranges.slice().sort(function(a,b){return b.from-a.from}).forEach(function(h){
      var seg=out.slice(h.from,h.to);re.lastIndex=0;var m=re.exec(seg);
      if(!m||m.index!==0||m[0].length!==seg.length)return; // تغيّر الملف منذ البحث: نتخطى
      out=out.slice(0,h.from)+(q.re?seg.replace(rx(),q.rep):q.rep)+out.slice(h.to);
    });
    if(out===t)return 0;
    if(W.tabs.indexOf(p)>-1&&W.E){W.E.cm.setText(p,out);W.dirty[p]=1;return saveFile(p).then(function(){return 1})}
    return V.write(W.pid,p,out).then(function(){return 1});
  });
}
function jumpTo(p,from,to){
  return openFile(p).then(function(){setTimeout(function(){W.E.cm.select(from,to);document.querySelector('#xdrawer').classList.remove('open');W.E.show&&W.E.show('c',1)},60)});
}

/* ---------- المشاريع ---------- */
function renderProjects(){
  var box=document.querySelector('#wsp');if(!box)return;
  V.projects().then(function(ps){
    W.projectsCount=ps.length;try{localStorage.setItem('wn_ws_count',String(ps.length))}catch(e){}
    box.innerHTML='<div class="xph"><span>PROJECTS</span><button class="xph-i" data-ws="newproj" aria-label="مشروع جديد">'+IC.plus+'</button></div>'+
      ps.map(function(p){return '<div class="wrow wproj'+(p.id===W.pid?' on':'')+'" style="--d:0"><button class="wmain" data-proj="'+p.id+'"><span class="wch"></span><span class="wfi dir">'+IC.folder+'</span><span class="wn">'+esc(p.name)+'<em>'+new Date(p.updated).toLocaleDateString('ar')+'</em></span></button><button class="wmore" data-pmenu="'+p.id+'" aria-label="خيارات">'+IC.more+'</button></div>'}).join('')+
      '<div class="xph"><span>DEVICE</span>'+(pro()?'':'<em class="xpro">PRO</em>')+'</div>'+
      '<button class="xrow" data-ws="devimport">'+IC.open+'<span>فتح مجلد مشروع من الهاتف</span></button>'+
      '<button class="xrow" data-ws="export">'+IC.upload+'<span>تصدير كملف HTML واحد</span></button>'+
      '<p class="wtip">مشاريعك محفوظة داخل التطبيق في هذا الجهاز. انتهاء الاشتراك لا يحذف أي مشروع أو ملف.</p>';
  });
}
function switchProject(id){
  if(id===W.pid)return;
  flush();
  var o=st();o.pid=id;lsSet(o);
  if(typeof render==='function')render();
}
function newProject(){
  if(!pro()&&W.projectsCount>=1)return Premium.paywall('files');
  return menu('مشروع جديد: اختر القالب',Object.keys(TPL).map(function(k){return {id:k,label:TPL[k].name+' — '+TPL[k].desc}})).then(function(k){
    if(!k)return;
    return ask('اسم المشروع','مشروع جديد').then(function(n){
      if(!n)return;
      return V.createProject(n,TPL[k].files).then(function(id){T('أُنشئ "'+n+'"','good');switchProject(id)});
    });
  }).catch(fail);
}
function projMenu(id){
  return V.project(id).then(function(p){
    if(!p)return;
    return menu(p.name,[{id:'open',label:'فتح'},{id:'rename',label:'إعادة تسمية'},{id:'dup',label:'نسخ المشروع'},{id:'save',label:'حفظ في الهاتف'},null,{id:'del',label:'حذف المشروع',danger:true}]).then(function(a){
      if(a==='open')return switchProject(id);
      if(a==='rename')return ask('اسم المشروع',p.name).then(function(n){if(!n)return;return V.renameProject(id,n).then(function(){if(id===W.pid){W.name=n;renderTree()}renderProjects()})});
      if(a==='dup'){if(!pro())return Premium.paywall('files');return V.duplicateProject(id).then(function(){renderProjects();T('نُسخ المشروع','good')})}
      if(a==='save')return devSave(id,p.name);
      if(a==='del')return confirmBox('حذف المشروع "'+p.name+'"؟','ستُحذف كل ملفاته من التطبيق نهائياً.','حذف المشروع').then(function(y){
        if(!y)return;
        return V.projects().then(function(ps){
          if(ps.length<2)return T('هذا مشروعك الوحيد. أنشئ مشروعاً آخر أولاً','bad');
          return V.deleteProject(id).then(function(){T('حُذف المشروع');if(id===W.pid){var o=st();delete o.tabs[id];o.pid=null;lsSet(o);if(typeof render==='function')render()}else renderProjects()});
        });
      });
    });
  }).catch(fail);
}

/* ---------- المعاينة: صفحة المشروع مع ملفاتها المرتبطة ---------- */
var LOCAL=function(u){return u&&!/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\{)/i.test(u.trim())};
function resolve(base,u){return V.norm(V.dirname(base)+'/'+decodeURI(u.split(/[?#]/)[0]))}
function inlineUrls(text,base){
  // url(...) في CSS وصور src في HTML ← data: من ملفات المشروع
  var jobs=[],seen={};
  text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,function(m,q,u){if(LOCAL(u))seen[u]=1});
  text.replace(/\b(?:src|poster)\s*=\s*["']([^"']+)["']/gi,function(m,u){if(LOCAL(u)&&!V.isText(u))seen[u]=1});
  text.replace(/<link\b[^>]*\brel=["']?(?:icon|shortcut icon)[^>]*>/gi,function(m){var h=/href=["']([^"']+)/.exec(m);if(h&&LOCAL(h[1]))seen[h[1]]=1});
  var map={};
  Object.keys(seen).forEach(function(u){var p=resolve(base,u);if(W.map[p])jobs.push(dataURL(p).then(function(d){if(d)map[u]=d}))});
  return Promise.all(jobs).then(function(){
    if(!Object.keys(map).length)return text;
    return text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,function(m,q,u){return map[u]?'url("'+map[u]+'")':m})
      .replace(/\b(src|poster|href)(\s*=\s*)(["'])([^"']+)\3/gi,function(m,a,eq,q,u){return map[u]?a+eq+q+map[u]+q:m});
  });
}
function build(){
  if(!W.E)return null;
  var entry=getLaunch()||(W.active&&V.langOf(W.active)==='html'?W.active:W.map['index.html']?'index.html':(W.items.find(function(f){return V.langOf(f.path)==='html'})||{}).path);
  if(!entry)return {page:'<p style="font-family:sans-serif">أضف ملف HTML (مثل index.html) لترى النتيجة.</p>',js:[]};
  return textOf(entry).then(function(html){
    var scripts=[],jobs=[];
    // CSS المرتبط ← <style>
    html=html.replace(/<link\b[^>]*>/gi,function(tag){
      if(!/\brel\s*=\s*["']?stylesheet/i.test(tag))return tag;
      var h=/\bhref\s*=\s*["']([^"']+)["']/i.exec(tag);if(!h||!LOCAL(h[1]))return tag;
      var p=resolve(entry,h[1]),id='\u0000css'+jobs.length+'\u0000';
      jobs.push(textOf(p).then(function(c){return W.map[p]?inlineUrls(c,p).then(function(x){return [id,'<style>/* '+p+' */\n'+x+'\n</style>']}):[id,'<!-- لم يوجد الملف '+esc(p)+' -->']}));
      return id;
    });
    // كل السكربتات (الخارجية والداخلية) تُنقل بالترتيب لتعمل بعد التقاط console
    html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,function(m,attrs,body){
      if(/\btype\s*=\s*["']?(?!text\/javascript|module|application\/javascript)[^"'\s>]+/i.test(attrs))return m; // JSON أو قوالب
      var s=/\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if(s){if(!LOCAL(s[1]))return m;var p=resolve(entry,s[1]);scripts.push(textOf(p).then(function(c){return W.map[p]?c:'console.error("لم يوجد الملف '+p.replace(/"/g,'')+'")'}))}
      else scripts.push(Promise.resolve(body));
      return '';
    });
    return Promise.all(jobs).then(function(parts){parts.forEach(function(x){html=html.split(x[0]).join(x[1])});return inlineUrls(html,entry)})
      .then(function(h){return Promise.all(scripts).then(function(js){return {page:h,js:js}})});
  });
}

/* ---------- الهاتف: حفظ مجلد كامل، واستيراد مجلد ---------- */
var DEV_DIR='WebNile',DOCS='DOCUMENTS';
function plug(n){return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins[n]}
function safeName(n){return String(n||'').trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'_').replace(/^\.+/,'').slice(0,60)}
function b64(blob){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(String(r.result).split(',')[1]||'')};r.onerror=no;r.readAsDataURL(blob)})}
function devSave(pid,name){
  if(!pro())return Premium.paywall('storage');
  return ask('اسم المجلد في Documents/'+DEV_DIR,safeName(name),'يُحفظ المشروع بكل مجلداته وملفاته','حفظ').then(function(n){
    n=safeName(n);if(!n)return;
    flush();
    var FS=plug('Filesystem');
    return V.all(pid).then(function(files){
      if(!FS)return exportHTML(pid,n);
      var ok=0;
      return Premium.fsReady().then(function(F){
        if(!F)return;
        return files.filter(function(f){return f.type==='file'&&V.basename(f.path)!=='.keep'}).reduce(function(pr,f){return pr.then(function(){
          var path=DEV_DIR+'/'+n+'/'+f.path;
          return (f.blob?b64(f.blob).then(function(d){return F.writeFile({path:path,data:d,directory:DOCS,recursive:true})}):F.writeFile({path:path,data:f.text||'',directory:DOCS,encoding:'utf8',recursive:true})).then(function(){ok++});
        })},Promise.resolve()).then(function(){T('حُفظ '+ok+' ملف في Documents/'+DEV_DIR+'/'+n,'good')});
      });
    }).catch(function(e){T('تعذّر الحفظ: '+(e&&e.message||'تحقق من مساحة التخزين'),'bad')});
  });
}
function devImport(){
  if(!pro())return Premium.paywall('storage');
  var FS=plug('Filesystem');
  if(!FS)return T('فتح المجلدات متاح في التطبيق على الهاتف. في المتصفح استعمل زر رفع الملفات','bad');
  return Premium.fsReady().then(function(F){
    if(!F)return;
    return F.readdir({path:DEV_DIR,directory:DOCS}).then(function(r){
      var dirs=(r.files||[]).filter(function(f){return typeof f==='string'||f.type==='directory'}).map(function(f){return typeof f==='string'?f:f.name});
      if(!dirs.length)return T('لا توجد مجلدات في Documents/'+DEV_DIR,'bad');
      return menu('اختر مجلداً من Documents/'+DEV_DIR,dirs.map(function(d){return {id:d,label:d}})).then(function(d){
        if(!d)return;
        var files={},count=0;
        var walk=function(rel){return F.readdir({path:DEV_DIR+'/'+d+(rel?'/'+rel:''),directory:DOCS}).then(function(r){
          return (r.files||[]).reduce(function(pr,f){return pr.then(function(){
            var nm=typeof f==='string'?f:f.name,p=rel?rel+'/'+nm:nm;
            if(typeof f!=='string'&&f.type==='directory')return walk(p);
            if(++count>500)return;
            var full=DEV_DIR+'/'+d+'/'+p;
            if(V.isText(nm))return F.readFile({path:full,directory:DOCS,encoding:'utf8'}).then(function(x){files[p]=x.data});
            return F.readFile({path:full,directory:DOCS}).then(function(x){return fetch('data:'+V.mimeOf(nm)+';base64,'+x.data).then(function(r){return r.blob()})}).then(function(b){files[p]=b});
          })},Promise.resolve());
        })};
        return walk('').then(function(){
          if(!Object.keys(files).length)return T('المجلد فارغ','bad');
          return V.createProject(d,files).then(function(id){T('فُتح "'+d+'" ('+Object.keys(files).length+' ملف)','good');switchProject(id)});
        });
      });
    }).catch(function(){T('لم أجد مجلد Documents/'+DEV_DIR+'. احفظ مشروعاً فيه أولاً','bad')});
  });
}
function exportHTML(pid,name){
  if(!pro())return Premium.paywall('files');
  flush();
  return Promise.resolve(build()).then(function(b){
    var js=(b.js||[]).map(function(c){return '<script>\n'+String(c).replace(/<\/script/gi,'<\\/script')+'\n</script>'}).join('\n');
    var page=/<\/body>/i.test(b.page)?b.page.replace(/<\/body>/i,js+'\n</body>'):b.page+js;
    if(!/^\s*<!doctype/i.test(page))page='<!DOCTYPE html>\n'+page;
    return Premium.share((safeName(name||W.name)||'webnile')+'.html',page,false,'text/html','مشروعي من ويب نايل');
  }).then(function(ok){if(ok===false)T('تعذّر التصدير','bad')});
}

/* ---------- أحداث اللوحة الجانبية ---------- */
function onDrawerClick(e){
  var b=e.target.closest('button');if(!b)return;
  var d=b.dataset;
  if(d.open!=null){var f=W.map[d.open];if(!f)return;if(f.type==='dir'){W.expanded[d.open]=!W.expanded[d.open];saveState();return renderTree()}return openFile(d.open).then(closeDrawerIfText(d.open))}
  if(d.menu)return itemMenu(d.menu);
  if(d.proj)return switchProject(d.proj);
  if(d.pmenu)return projMenu(d.pmenu);
  if(d.hit){var gh=d.hit.split(':'),g=W.q.res.groups[+gh[0]],h=g.hits[+gh[1]];return jumpTo(g.path,h.from,h.to)}
  if(d.rep){var gr=d.rep.split(':'),g2=W.q.res.groups[+gr[0]],h2=g2.hits[+gr[1]];W.q.rep=document.querySelector('#wsq-r').value;return replaceIn(g2.path,[h2]).then(runSearch)}
  if(d.q){
    if(d.q==='go'){readQ();return runSearch()}
    if(d.q==='all'){readQ();var r=W.q.res;if(!r)return;return confirmBox('استبدال '+r.n+' نتيجة؟','في '+r.groups.length+' ملف، بـ "'+W.q.rep+'"','استبدال الكل').then(function(y){if(!y)return;return Promise.all(r.groups.map(function(g){return replaceIn(g.path,g.hits)})).then(function(x){T('اُستبدل في '+x.filter(Boolean).length+' ملف','good');return runSearch()})})}
    W.q[d.q]=!W.q[d.q];readQ();return renderSearch();
  }
  var a=d.ws;if(!a)return;
  if(a==='newfile')return newItem('',false);
  if(a==='newdir')return newItem('',true);
  if(a==='upload')return upload(null);
  if(a==='locate')return reveal(W.active);
  if(a==='collapse'){W.expanded={};saveState();return renderTree()}
  if(a==='paste')return paste(d.dir||'');
  if(a==='clipx'){W.clip=null;return renderTree()}
  if(a==='devsave')return devSave(W.pid,W.name);
  if(a==='devimport')return devImport();
  if(a==='export')return exportHTML(W.pid,W.name);
  if(a==='newproj')return newProject();
}
function readQ(){var g=function(id){var i=document.querySelector(id);return i?i.value:''};W.q.text=g('#wsq-t');W.q.rep=g('#wsq-r');W.q.ex=g('#wsq-x')}
function onDrawerInput(e){
  if(e.target.id==='ws-filter'){W.filter=e.target.value;renderTree()}
  if(e.target.id==='wsq-t'&&e.isTrusted===false)return;
}
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&e.target.id==='wsq-t'){readQ();runSearch()}});

window.WS={load:load,attach:attach,detach:detach,build:build,openFile:openFile,flush:flush,state:W,relPath:relPath,TPL:TPL,_search:runSearch};
})();
