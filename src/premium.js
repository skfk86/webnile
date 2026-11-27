/* ويب نايل برو — الاشتراك عبر Google Play Billing (cordova-plugin-purchase v13)
   المنتجات (أنشئها في Play Console بهذه المعرّفات حرفياً):
     webnile_pro            اشتراك، فيه خطتان أساسيتان: monthly و yearly (ويمكن إضافة عرض تجربة مجانية)
     webnile_pro_lifetime   منتج داخل التطبيق لمرة واحدة (اختياري)
   المزايا تُقرأ دائماً من Premium.active()، والحالة تُحفظ في localStorage "webnile_pro". */
(function(){
var SUB='webnile_pro',LIFE='webnile_pro_lifetime',PKG='com.webnile.app';
var GRACE=7*864e5;           // نثق بآخر تحقق ناجح 7 أيام إن لم يتصل الجهاز بـ Google Play
var FREEZES=3;               // حمايات السلسلة كل شهر للمشتركين
var KEY='webnile_pro',PKEY='webnile_projects';

var st={};try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
function dev(){try{return localStorage.getItem('webnile_pro_dev')==='1'}catch(e){return false}}
function active(){
  if(dev())return true;
  if(!st.on)return false;
  if(st.plan==='life')return true;
  return Date.now()-(st.at||0)<GRACE;
}
var listeners=[];
function changed(){listeners.forEach(function(f){try{f(active())}catch(e){}});if(typeof render==='function')try{render()}catch(e){}}
function setOwned(on,plan){
  var was=active();
  st.on=!!on;if(on){st.plan=plan;st.at=Date.now();if(!st.since)st.since=Date.now()}else{st.plan=null}
  persist();
  if(was!==active())changed();
}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function tst(m,c){if(typeof toast==='function')toast(m,c||'')}

/* ---------- Google Play Billing ---------- */
var store=null,ready=false,busy=false,initErr=null;
function C(){return window.CdvPurchase}
function owned(){
  if(!store)return null;
  if(store.owned(LIFE))return 'life';
  if(store.owned(SUB))return 'sub';
  return false;
}
function refresh(){
  if(!store||!ready)return;
  var o=owned();
  setOwned(!!o,o||null);
}
function initStore(){
  var P=C();if(!P||!P.store||store)return;
  store=P.store;
  var GP=P.Platform.GOOGLE_PLAY;
  store.verbosity=P.LogLevel?P.LogLevel.WARNING:1;
  store.register([
    {id:SUB,type:P.ProductType.PAID_SUBSCRIPTION,platform:GP},
    {id:LIFE,type:P.ProductType.NON_CONSUMABLE,platform:GP}
  ]);
  store.when()
    .approved(function(t){return t.verify()})
    .verified(function(r){return r.finish()})   // finish() = acknowledge، وإلا تسترد Google المبلغ بعد 3 أيام
    .finished(function(){refresh()})
    .receiptUpdated(function(){refresh()})
    .productUpdated(function(){if(PW.open)PW.paint()});
  store.error(function(e){initErr=e});
  store.initialize([GP]).then(function(errs){
    ready=true;
    if(errs&&errs.length)initErr=errs[0];
    refresh();
    if(PW.open)PW.paint();
  });
}
document.addEventListener('deviceready',initStore,false);
if(C())setTimeout(initStore,0);

/* خطط العرض: نقرأ العروض الحقيقية من Google Play (السعر بعملة المستخدم) */
function plans(){
  var out=[];
  if(!store)return out;
  var sub=store.get(SUB),life=store.get(LIFE);
  if(sub&&sub.offers){
    var by={};
    sub.offers.forEach(function(o){
      var ph=o.pricingPhases||[];if(!ph.length)return;
      var base=ph[ph.length-1];
      var per=/Y/.test(base.billingPeriod||'')?'y':/M/.test(base.billingPeriod||'')?'m':null;if(!per)return;
      var trial=ph.find(function(x){return x.priceMicros===0});
      var cur=by[per];
      if(!cur||(trial&&!cur.trial))by[per]={per:per,offer:o,price:base.price,micros:base.priceMicros,trial:trial?trial.billingPeriod:null};
    });
    if(by.y)out.push(by.y);
    if(by.m)out.push(by.m);
    if(by.y&&by.m&&by.m.micros>0)by.y.save=Math.round((1-by.y.micros/(by.m.micros*12))*100);
  }
  if(life&&life.offers&&life.offers[0]){
    var lp=(life.offers[0].pricingPhases||[])[0];
    out.push({per:'l',offer:life.offers[0],price:lp?lp.price:life.pricing&&life.pricing.price});
  }
  return out;
}
function period(p){var m=/P(\d+)([DWMY])/.exec(p||'');if(!m)return '';var n=+m[1],u=m[2];
  if(u==='D')return n===7?'أسبوع':n+' أيام';if(u==='W')return n===1?'أسبوع':n===2?'أسبوعين':n+' أسابيع';if(u==='M')return n===1?'شهر':n+' أشهر';return 'سنة'}
function buy(plan){
  if(!plan||busy)return;
  busy=true;PW.paint();
  plan.offer.order().then(function(err){
    busy=false;
    if(err){
      var P=C();
      if(!(P&&P.ErrorCode&&err.code===P.ErrorCode.PAYMENT_CANCELLED))tst('لم تكتمل العملية: '+(err.message||'حاول مرة أخرى'),'bad');
    }
    PW.paint();
    setTimeout(function(){refresh();if(active()){PW.close();welcome()}},300);
  }).catch(function(){busy=false;PW.paint()});
}
function restore(){
  if(!store){tst('الاستعادة متاحة في نسخة التطبيق من Google Play','bad');return}
  busy=true;PW.paint();
  Promise.resolve(store.restorePurchases()).then(function(){
    busy=false;refresh();PW.paint();
    if(active()){PW.close();tst('👑 تمت استعادة اشتراكك','good')}else tst('لا يوجد اشتراك سابق على حساب Google هذا','bad');
  }).catch(function(){busy=false;PW.paint();tst('تعذّرت الاستعادة، تحقق من الاتصال','bad')});
}
function manage(){
  var u='https://play.google.com/store/account/subscriptions?sku='+SUB+'&package='+PKG;
  try{if(store&&store.manageSubscriptions)return store.manageSubscriptions()}catch(e){}
  window.open(u,'_system');
}

/* ---------- المزايا ---------- */
var PERKS=[
  ['🚀','6 مشاريع احترافية حصرية','صفحة هبوط، حاسبة، معرض بفلاتر، فاحص كلمات مرور، متتبّع مصاريف، مؤقت بومودورو. مع الحل النموذجي لكل مشروع.'],
  ['🔓','تنقّل حر في كل الدروس','افتح أي درس أو تخطَّه دون أن تدفع نقاطك.'],
  ['❄️',FREEZES+' حمايات للسلسلة كل شهر','فاتك يوم؟ تحمي الحماية سلسلتك تلقائياً.'],
  ['📁','مشاريع غير محدودة في المحرر','احفظ كل مشروع باسمه وارجع إليه، وصدّره ملف HTML جاهزاً للنشر.'],
  ['🎓','شهادة احترافية كصورة','شهادة بتصميم فاخر ورمز تعريف فريد، تشاركها على LinkedIn وواتساب.'],
  ['💚','تدعم استمرار التطبيق','بلا إعلانات أبداً، واشتراكك يموّل دروساً ومشاريع جديدة.']
];
var REASON={
  projects:'المشاريع الاحترافية حصرية لمشتركي برو',
  unlock:'مع برو تفتح أي درس دون نقاط',
  files:'احفظ مشاريع غير محدودة وصدّرها',
  cert:'شهادتك الاحترافية بانتظارك',
  me:'ارفع مستواك مع ويب نايل برو'
};

/* ---------- شاشة الاشتراك ---------- */
var PW={open:false,sel:0,why:'me',el:null};
PW.close=function(){if(!PW.el)return;PW.open=false;PW.el.classList.remove('show');document.body.classList.remove('pw-on')};
PW.paint=function(){
  if(!PW.el)return;
  var ps=plans(),on=active();
  if(PW.sel>=ps.length)PW.sel=0;
  var p=ps[PW.sel];
  var plansH;
  if(ps.length){
    plansH=ps.map(function(x,i){
      var name=x.per==='y'?'سنوي':x.per==='m'?'شهري':'مدى الحياة';
      var pr='<bdi>'+esc(x.price)+'</bdi>',sub=x.per==='y'?pr+' / سنة':x.per==='m'?pr+' / شهر':pr+' مرة واحدة';
      var tag=x.per==='y'&&x.save>0?'<span class="pw-tag">وفّر <bdi>'+x.save+'%</bdi></span>':x.per==='l'?'<span class="pw-tag alt">بلا تجديد</span>':'';
      var tr=x.trial?'<small>'+period(x.trial)+' مجاناً ثم '+sub+'</small>':'<small>'+sub+'</small>';
      return '<button class="pw-plan'+(i===PW.sel?' on':'')+'" data-pi="'+i+'"><i></i><span><b>'+name+'</b>'+tr+'</span>'+tag+'</button>';
    }).join('');
  }else{
    var why=!C()?'الاشتراك متاح عند تثبيت التطبيق من Google Play.':!ready?'جارٍ تحميل الأسعار من Google Play…':'تعذّر تحميل الأسعار. تحقق من اتصالك ثم أعد فتح الصفحة.';
    plansH='<div class="pw-na">'+why+'</div>';
  }
  var cta=on?'👑 أنت مشترك بالفعل':busy?'جارٍ التنفيذ…':p?(p.trial?'ابدأ '+period(p.trial)+' مجاناً':p.per==='l'?'اشترِ برو مدى الحياة':'اشترك الآن'):'غير متاح الآن';
  PW.el.querySelector('.pw-box').innerHTML=
    '<button class="pw-x" data-pw="close" aria-label="إغلاق">✕</button>'+
    '<div class="pw-head"><div class="pw-crown">👑</div><h2>ويب نايل <b>برو</b></h2><p>'+esc(REASON[PW.why]||REASON.me)+'</p></div>'+
    '<div class="pw-perks">'+PERKS.map(function(k){return '<div class="pw-perk"><span>'+k[0]+'</span><div><b>'+k[1]+'</b><small>'+k[2]+'</small></div></div>'}).join('')+'</div>'+
    '<div class="pw-free">✅ يبقى مجاناً للجميع: كل دروس الدورة الأساسية، والاختبارات، والتلميحات، والمحرر، وشهادة الإتمام.</div>'+
    '<div class="pw-plans">'+plansH+'</div>'+
    '<button class="pw-cta" data-pw="buy"'+(on||busy||!p?' disabled':'')+'>'+cta+'</button>'+
    '<div class="pw-links"><button data-pw="restore">استعادة المشتريات</button>'+(on&&st.plan!=='life'?'<button data-pw="manage">إدارة الاشتراك</button>':'')+'</div>'+
    '<p class="pw-legal">'+(p&&p.per!=='l'?'يتجدد الاشتراك تلقائياً بنفس السعر حتى تلغيه. ألغِ في أي وقت من Google Play ← الاشتراكات، قبل 24 ساعة من موعد التجديد. '+(p.trial?'لن تُحاسَب إن ألغيت قبل نهاية الفترة المجانية. ':''):'')+'الدفع عبر حسابك في Google Play.</p>';
};
function paywall(why){
  if(!PW.el){
    var d=document.createElement('div');d.className='pw';d.id='paywall';d.innerHTML='<div class="pw-box"></div>';
    document.body.appendChild(d);PW.el=d;
    d.addEventListener('click',function(e){
      if(e.target===d)return PW.close();
      var pl=e.target.closest('[data-pi]');if(pl){PW.sel=+pl.dataset.pi;return PW.paint()}
      var a=e.target.closest('[data-pw]');if(!a)return;
      var k=a.dataset.pw;
      if(k==='close')PW.close();
      else if(k==='buy')buy(plans()[PW.sel]);
      else if(k==='restore')restore();
      else if(k==='manage')manage();
    });
  }
  PW.why=why||'me';PW.open=true;PW.paint();
  if(store&&ready)try{store.update()}catch(e){}
  requestAnimationFrame(function(){PW.el.classList.add('show');document.body.classList.add('pw-on')});
}
function welcome(){tst('👑 أهلاً بك في ويب نايل برو! كل المزايا مفتوحة الآن','good')}

/* ---------- حماية السلسلة ---------- */
function month(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)}
function freezesLeft(){if(!active())return 0;if(!st.fz||st.fz.m!==month())return FREEZES;return Math.max(0,FREEZES-st.fz.u)}
function nextStreak(S,today,yesterday){
  if(S.last===today)return S.streak;
  if(S.last===yesterday)return S.streak+1;
  if(S.last&&S.streak>0&&active()){
    var gap=Math.round((new Date(today)-new Date(S.last))/864e5)-1; // الأيام الفائتة
    var left=freezesLeft();
    if(gap>0&&gap<=left){
      if(!st.fz||st.fz.m!==month())st.fz={m:month(),u:0};
      st.fz.u+=gap;persist();
      setTimeout(function(){tst('❄️ حمت '+(gap===1?'حماية واحدة':gap+' حمايات')+' سلسلتك! تبقّى '+freezesLeft()+' هذا الشهر','good')},2700);
      return S.streak+1;
    }
  }
  return 1;
}

/* ---------- مشاريعي في التجربة الحرة ---------- */
var PK={html:'webnile_play',css:'webnile_play_css',js:'webnile_play_js'};
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function projects(){try{return JSON.parse(lsGet(PKEY,'[]'))||[]}catch(e){return[]}}
function saveProjects(a){lsSet(PKEY,JSON.stringify(a))}
function current(){return {html:lsGet(PK.html,''),css:lsGet(PK.css,''),js:lsGet(PK.js,'')}}
function bundle(p){
  var css=p.css&&p.css.trim()?'<style>\n'+p.css+'\n</style>\n':'',js=p.js&&p.js.trim()&&!/^\s*\/\/[^\n]*\s*$/.test(p.js)?'<script>\n'+p.js.replace(/<\/script/gi,'<\\/script')+'\n<\/script>\n':'';
  var h=p.html||'';
  if(/<html[\s>]/i.test(h)){
    h=/<\/head>/i.test(h)?h.replace(/<\/head>/i,css+'</head>'):css+h;
    return /<\/body>/i.test(h)?h.replace(/<\/body>/i,js+'</body>'):h+js;
  }
  return '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>'+esc(p.name||'مشروعي')+'</title>\n'+css+'</head>\n<body>\n'+h+'\n'+js+'</body>\n</html>\n';
}
function plug(n){return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins[n]}
async function shareFile(name,data,isB64,mime,text){
  var FS=plug('Filesystem'),SH=plug('Share');
  if(FS&&SH){
    var w=await FS.writeFile({path:name,data:data,directory:'CACHE',encoding:isB64?undefined:'utf8'});
    await SH.share({title:name,text:text||'',files:[w.uri],dialogTitle:'مشاركة'});
    return true;
  }
  try{
    var blob=isB64?await (await fetch('data:'+mime+';base64,'+data)).blob():new Blob([data],{type:mime});
    var f=new File([blob],name,{type:mime});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:text||''});return true}
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
    return true;
  }catch(e){return false}
}
function playBar(){
  var n=projects().length,on=active();
  return '<div class="pj-bar"><button data-pj="list">📁 مشاريعي'+(on&&n?' ('+n+')':'')+(on?'':' <span class="pro-pill">برو</span>')+'</button><button data-pj="save">💾 حفظ باسم</button><button data-pj="export">⤴ تصدير HTML</button></div>';
}
var sheet=null;
function pjSheet(html){
  if(!sheet){sheet=document.createElement('div');sheet.className='overlay';sheet.id='pj-sheet';sheet.innerHTML='<div class="sheet pj-sheet"></div>';document.body.appendChild(sheet);
    sheet.addEventListener('click',function(e){if(e.target===sheet)sheet.classList.remove('show');pjAct(e)})}
  sheet.querySelector('.sheet').innerHTML=html;
  requestAnimationFrame(function(){sheet.classList.add('show')});
}
function pjList(){
  var a=projects();
  pjSheet('<h3>📁 مشاريعي</h3>'+(a.length?'<div class="pj-list">'+a.map(function(p,i){return '<div class="pj-item"><button data-pj="open" data-i="'+i+'"><b>'+esc(p.name)+'</b><small>'+new Date(p.at).toLocaleDateString('ar')+'</small></button><button data-pj="del" data-i="'+i+'" aria-label="حذف">🗑</button></div>'}).join('')+'</div>':'<p>لا توجد مشاريع محفوظة بعد. اضغط "حفظ باسم" لتحفظ مشروعك الحالي.</p>')+'<div class="sheet-btns"><button data-pj="new" style="background:var(--nile);color:#fff">＋ مشروع جديد</button><button data-pj="x" style="background:var(--line);color:var(--ink)">إغلاق</button></div>');
}
function pjSave(){
  pjSheet('<h3>💾 حفظ المشروع</h3><p>اختر اسماً لمشروعك الحالي (الملفات الثلاثة معاً).</p><input id="pj-name" class="pj-in" maxlength="40" placeholder="مثلاً: موقع المقهى"><div class="sheet-btns"><button data-pj="dosave" style="background:var(--nile);color:#fff">حفظ</button><button data-pj="x" style="background:var(--line);color:var(--ink)">إلغاء</button></div>');
  setTimeout(function(){var i=document.getElementById('pj-name');if(i)i.focus()},300);
}
function loadInto(p){lsSet(PK.html,p.html||'');lsSet(PK.css,p.css||'');lsSet(PK.js,p.js||'');if(typeof render==='function')render()}
function pjAct(e){
  var b=e.target.closest('[data-pj]');if(!b)return;
  var k=b.dataset.pj,i=+b.dataset.i,a=projects();
  if(k==='x'){sheet.classList.remove('show');return}
  if(k==='open'){loadInto(a[i]);sheet.classList.remove('show');tst('فُتح "'+a[i].name+'"','good');return}
  if(k==='del'){if(b.dataset.armed!=='1'){b.dataset.armed='1';b.textContent='تأكيد؟';return}var n=a[i].name;a.splice(i,1);saveProjects(a);pjList();tst('حُذف "'+n+'"');return}
  if(k==='new'){var c=current();if(c.html||c.css)lsSet('webnile_play_backup',JSON.stringify(c));loadInto({html:'<h1>مشروع جديد</h1>\n',css:'body {\n  font-family: Cairo, sans-serif;\n}\n',js:'// اكتب JavaScript هنا\n'});sheet.classList.remove('show');return}
  if(k==='dosave'){var nm=(document.getElementById('pj-name').value||'').trim();if(!nm){tst('اكتب اسماً للمشروع','bad');return}
    var cur=current();cur.name=nm;cur.at=Date.now();var j=a.findIndex(function(x){return x.name===nm});if(j>-1)a[j]=cur;else a.unshift(cur);saveProjects(a);sheet.classList.remove('show');tst('💾 حُفظ "'+nm+'"','good');return}
}
function bindPlay(){
  var bar=document.querySelector('.pj-bar');if(!bar)return;
  bar.onclick=async function(e){
    var b=e.target.closest('[data-pj]');if(!b)return;
    if(!active())return paywall('files');
    var k=b.dataset.pj;
    if(k==='list')pjList();
    else if(k==='save')pjSave();
    else if(k==='export'){var p=current();p.name='مشروعي';var ok=await shareFile('webnile-project.html',bundle(p),false,'text/html','مشروعي من ويب نايل');if(!ok)tst('تعذّر التصدير','bad')}
  };
}

/* ---------- الشهادة الاحترافية ---------- */
function code(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}var x=h.toString(36).toUpperCase();while(x.length<8)x='0'+x;return 'WN-'+x.slice(0,4)+'-'+x.slice(4,8)}
async function certImage(o){
  try{if(document.fonts&&document.fonts.load){await Promise.all([document.fonts.load('900 60px Cairo'),document.fonts.load('700 30px Cairo')])}}catch(e){}
  var W=1600,H=1130,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
  var g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0B1F2A');g.addColorStop(1,'#0E3A44');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle='#F5B83D';x.lineWidth=6;x.strokeRect(40,40,W-80,H-80);x.lineWidth=2;x.strokeRect(58,58,W-116,H-116);
  x.strokeStyle='rgba(18,181,166,.35)';x.lineWidth=3;for(var k=0;k<3;k++){x.beginPath();for(var px=60;px<=W-60;px+=10){var py=H-150+k*22+Math.sin(px/60)*8;px===60?x.moveTo(px,py):x.lineTo(px,py)}x.stroke()}
  x.direction='rtl';x.textAlign='center';var F="'Cairo',system-ui,sans-serif";
  x.fillStyle='#F5B83D';x.font='900 44px '+F;x.fillText('ويب نايل · Web Nile',W/2,150);
  x.fillStyle='#9DB8C0';x.font='700 34px '+F;x.fillText('شهادة إتمام دورة تطوير الويب',W/2,230);
  x.fillStyle='#EAF4F3';x.font='600 30px '+F;x.fillText('تشهد ويب نايل بأن',W/2,320);
  x.fillStyle='#FFFFFF';x.font='900 92px '+F;x.fillText(o.name,W/2,440);
  x.fillStyle='#12B5A6';x.fillRect(W/2-220,475,440,4);
  x.fillStyle='#EAF4F3';x.font='600 32px '+F;
  x.fillText('أتمّ '+o.lessons+' درساً ومشروعاً في HTML وCSS وJavaScript',W/2,560);
  if(o.pro)x.fillText('بالإضافة إلى '+o.pro+' مشاريع احترافية',W/2,612);
  if(o.avg!=null){x.fillStyle='#F5B83D';x.font='700 32px '+F;x.fillText('متوسط اختبارات الوحدات: '+o.avg+'%',W/2,o.pro?672:620)}
  x.fillStyle='#9DB8C0';x.font='600 26px '+F;x.textAlign='right';x.fillText('تاريخ الإتمام: '+o.date,W-120,H-200);
  x.textAlign='left';x.direction='ltr';x.font='700 26px ui-monospace,Menlo,monospace';x.fillText('ID: '+o.id,120,H-200);
  x.font='160px serif';x.textAlign='center';x.fillText('🎓',W/2,860);
  return cv.toDataURL('image/png');
}
function certBtn(){return '<button class="btn" style="width:100%;margin-top:8px;background:linear-gradient(90deg,#F5B83D,#FFD27A);color:#0B1F2A" id="pro-cert">👑 حمّل الشهادة الاحترافية (صورة)'+(active()?'':' <span class="pro-pill">برو</span>')+'</button>'}
function meCard(){
  if(active()){
    var life=st.plan==='life'||dev();
    return '<div class="card pro-card on"><div class="pro-h"><span>👑</span><div><b>أنت مشترك في ويب نايل برو</b><small>'+(life?'اشتراك مدى الحياة':'يتجدد تلقائياً عبر Google Play')+'</small></div></div><div class="pro-stats"><div><b>'+freezesLeft()+'</b><small>❄️ حمايات السلسلة هذا الشهر</small></div><div><b>'+projects().length+'</b><small>📁 مشاريع محفوظة</small></div></div>'+(life?'':'<button class="btn" data-pw-open="manage" style="width:100%;margin-top:10px">إدارة الاشتراك</button>')+'</div>';
  }
  return '<div class="card pro-card"><div class="pro-h"><span>👑</span><div><b>ويب نايل برو</b><small>6 مشاريع احترافية، وتنقل حر، وحماية السلسلة، ومشاريع غير محدودة، وشهادة احترافية</small></div></div><button class="btn s" data-pw-open="me" style="width:100%;margin-top:10px">اكتشف برو</button></div>';
}
function bindMe(ctx){
  document.querySelectorAll('[data-pw-open]').forEach(function(b){b.onclick=function(){b.dataset.pwOpen==='manage'?manage():paywall(b.dataset.pwOpen)}});
  var c=document.getElementById('pro-cert');
  if(c)c.onclick=async function(){
    if(!active())return paywall('cert');
    if(!ctx.name){tst('اكتب اسمك على الشهادة أولاً','bad');var i=document.getElementById('cname');if(i)i.focus();return}
    c.disabled=true;c.textContent='جارٍ إنشاء الشهادة…';
    var id=code(ctx.name+'|'+ctx.date+'|'+ctx.lessons);
    var url=await certImage({name:ctx.name,lessons:ctx.lessons,pro:ctx.pro,avg:ctx.avg,date:ctx.date,id:id});
    var ok=await shareFile('webnile-certificate.png',url.split(',')[1],true,'image/png','🎓 أتممت دورة تطوير الويب في تطبيق ويب نايل! رمز الشهادة: '+id);
    c.disabled=false;c.innerHTML='👑 حمّل الشهادة الاحترافية (صورة)';
    if(!ok)tst('تعذّر حفظ الصورة','bad');
  };
}

window.Premium={
  active:active,paywall:paywall,onChange:function(f){listeners.push(f)},
  nextStreak:nextStreak,freezesLeft:freezesLeft,
  playBar:playBar,bindPlay:bindPlay,
  meCard:meCard,certBtn:certBtn,bindMe:bindMe,
  restore:restore,manage:manage,
  _bundle:bundle,_code:code,_plans:plans
};
})();
