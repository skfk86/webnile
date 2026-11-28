/* ويب نايل برو — الاشتراك عبر Google Play Billing (cordova-plugin-purchase v13)
   المنتجات (أنشئها في Play Console بهذه المعرّفات حرفياً):
     webnile_pro            اشتراك، فيه خطتان أساسيتان: monthly و yearly (ويمكن إضافة عرض تجربة مجانية)
     webnile_pro_lifetime   منتج داخل التطبيق لمرة واحدة (اختياري)
   المزايا تُقرأ دائماً من Premium.active()، والحالة تُحفظ في localStorage "webnile_pro". */
(function(){
var SUB='webnile_pro',LIFE='webnile_pro_lifetime',PKG='com.webnile.app';
var GRACE=7*864e5;           // نثق بآخر تحقق ناجح 7 أيام إن لم يتصل الجهاز بـ Google Play
var FREEZES=3;               // حمايات السلسلة كل شهر للمشتركين
var KEY='webnile_pro';

var st={};try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
// مفتاح التجربة يعمل في المتصفح فقط أثناء التطوير، ولا يمنح برو أبداً داخل التطبيق المثبّت
function native(){try{return !!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())}catch(e){return false}}
function dev(){if(native())return false;try{return localStorage.getItem('webnile_pro_dev')==='1'}catch(e){return false}}
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
function I(n){return '<svg class="i"><use href="#i-'+n+'"/></svg>'}

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
    if(active()){PW.close();tst('تمت استعادة اشتراكك في برو','good')}else tst('لا يوجد اشتراك سابق على حساب Google هذا','bad');
  }).catch(function(){busy=false;PW.paint();tst('تعذّرت الاستعادة، تحقق من الاتصال','bad')});
}
function manage(){
  var u='https://play.google.com/store/account/subscriptions?sku='+SUB+'&package='+PKG;
  try{if(store&&store.manageSubscriptions)return store.manageSubscriptions()}catch(e){}
  window.open(u,'_system');
}

/* ---------- المزايا ---------- */
var PERKS=[
  ['rocket','6 مشاريع احترافية حصرية','صفحة هبوط، حاسبة، معرض بفلاتر، فاحص كلمات مرور، متتبّع مصاريف، مؤقت بومودورو. مع الحل النموذجي لكل مشروع.'],
  ['code','أدوات المحرر الاحترافية','فتح الملفات من الهاتف وحفظها فيه، ومكتبة قوالب بمواضع تعديل مع قوالبك الخاصة، ومشاريع غير محدودة محفوظة بأسماء، وتصدير HTML.'],
  ['lock-open','تنقّل حر في كل الدروس','افتح أي درس أو تخطَّه دون أن تدفع نقاطك.'],
  ['snowflake',FREEZES+' حمايات للسلسلة كل شهر','فاتك يوم؟ تحمي الحماية سلسلتك تلقائياً.'],
  ['grad','شهادة احترافية كصورة','شهادة بتصميم فاخر ورمز تعريف فريد، تشاركها على LinkedIn وواتساب.'],
  ['heart','تدعم استمرار التطبيق','بلا إعلانات أبداً، واشتراكك يموّل دروساً ومشاريع جديدة.']
];
var REASON={
  projects:'المشاريع الاحترافية حصرية لمشتركي برو',
  unlock:'مع برو تفتح أي درس دون نقاط',
  files:'احفظ مشاريع غير محدودة وصدّرها',
  storage:'افتح ملفاتك من الهاتف واحفظ مشاريعك فيه',
  snippets:'مكتبة القوالب وقوالبك الخاصة باختصار وزر Tab',
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
  var cta=on?'أنت مشترك بالفعل':busy?'جارٍ التنفيذ…':p?(p.trial?'ابدأ '+period(p.trial)+' مجاناً':p.per==='l'?'اشترِ برو مدى الحياة':'اشترك الآن'):'غير متاح الآن';
  PW.el.querySelector('.pw-box').innerHTML=
    '<button class="pw-x" data-pw="close" aria-label="إغلاق">'+I('x')+'</button>'+
    '<div class="pw-head"><div class="pw-crown">'+I('crown')+'</div><h2>ويب نايل <b>برو</b></h2><p>'+esc(REASON[PW.why]||REASON.me)+'</p></div>'+
    '<div class="pw-perks">'+PERKS.map(function(k){return '<div class="pw-perk"><span>'+I(k[0])+'</span><div><b>'+k[1]+'</b><small>'+k[2]+'</small></div></div>'}).join('')+'</div>'+
    '<div class="pw-free">'+I('circle-check')+'<span>يبقى مجاناً للجميع: كل دروس الدورة الأساسية، والاختبارات، والتلميحات، والمحرر وتشغيل الكود، وشهادة الإتمام.</span></div>'+
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
function welcome(){tst('أهلاً بك في ويب نايل برو! كل المزايا مفتوحة الآن','good')}

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
      setTimeout(function(){tst('حمت '+(gap===1?'حماية واحدة':gap+' حمايات')+' سلسلتك! تبقّى '+freezesLeft()+' هذا الشهر','good')},2700);
      return S.streak+1;
    }
  }
  return 1;
}

/* ---------- مشاريعي في التجربة الحرة ---------- */
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
/* ---------- الوصول لمساحة تخزين الهاتف (برو) ----------
   مشاريع المحرر الحر صارت في src/workspace.js (نظام ملفات بمجلدات في IndexedDB)، وهو يستعمل fsReady و shareFile من هنا. */
async function fsReady(){
  var FS=plug('Filesystem');if(!FS)return null;
  try{var p=await FS.checkPermissions();if(p&&p.publicStorage!=='granted'){p=await FS.requestPermissions();if(p&&p.publicStorage==='denied'){tst('اسمح للتطبيق بالوصول للتخزين من إعدادات الهاتف','bad');return null}}}catch(e){}
  return FS;
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
  try{var cap=(window.WN_ICON_PATHS||{}).grad;if(cap){x.save();x.translate(W/2-90,690);x.scale(7.5,7.5);x.strokeStyle='#F5B83D';x.lineWidth=1.6;x.lineCap='round';x.lineJoin='round';(cap.match(/d="([^"]+)"/g)||[]).forEach(function(m){x.stroke(new Path2D(m.slice(3,-1)))});x.restore()}}catch(e){}
  return cv.toDataURL('image/png');
}
function projCount(){try{return +localStorage.getItem('wn_ws_count')||1}catch(e){return 1}}
function certBtn(){return '<button class="btn" style="width:100%;margin-top:8px;background:linear-gradient(90deg,#F5B83D,#FFD27A);color:#0B1F2A" id="pro-cert">'+I('crown')+' حمّل الشهادة الاحترافية (صورة)'+(active()?'':' <span class="pro-pill">برو</span>')+'</button>'}
function meCard(){
  if(active()){
    var life=st.plan==='life'||dev();
    return '<div class="card pro-card on"><div class="pro-h"><span>'+I('crown')+'</span><div><b>أنت مشترك في ويب نايل برو</b><small>'+(life?'اشتراك مدى الحياة':'يتجدد تلقائياً عبر Google Play')+'</small></div></div><div class="pro-stats"><div><b>'+freezesLeft()+'</b><small>'+I('snowflake')+' حمايات السلسلة هذا الشهر</small></div><div><b>'+projects().length+'</b><small>'+I('folder')+' مشاريع محفوظة</small></div></div>'+(life?'':'<button class="btn" data-pw-open="manage" style="width:100%;margin-top:10px">إدارة الاشتراك</button>')+'</div>';
  }
  return '<div class="card pro-card"><div class="pro-h"><span>'+I('crown')+'</span><div><b>ويب نايل برو</b><small>6 مشاريع احترافية، وأدوات المحرر الاحترافية، وتنقل حر، وحماية السلسلة، وشهادة احترافية</small></div></div><button class="btn s" data-pw-open="me" style="width:100%;margin-top:10px">اكتشف برو</button></div>';
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
    c.disabled=false;c.innerHTML=I('crown')+' حمّل الشهادة الاحترافية (صورة)';
    if(!ok)tst('تعذّر حفظ الصورة','bad');
  };
}

window.Premium={
  active:active,paywall:paywall,onChange:function(f){listeners.push(f)},
  nextStreak:nextStreak,freezesLeft:freezesLeft,
  fsReady:fsReady,share:shareFile,
  meCard:meCard,certBtn:certBtn,bindMe:bindMe,
  restore:restore,manage:manage,
  _code:code,_plans:plans
};
})();
