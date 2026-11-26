/* ───── نيلو: الشخصية المشجعة في ويب نايل ─────
   وحدة مستقلة. التطبيق يكلّمها فقط عبر:
     Mascot.event(name, data)   // view | pass | fail | error
     Mascot.say(text, {mood, anim, ms})
   المزاج: happy | cheer | oops | think | wink | sleep
   الحركة: jump | shake | wave | cheer
*/
(function(){
'use strict';
const KEY='webnile_mascot';
let P={quiet:false,seen:{}};
try{Object.assign(P,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const appState=()=>{try{return JSON.parse(localStorage.getItem('webnile2')||'{}')}catch(e){return{}}};

/* ── العبارات ── */
const L={
  morning:['صباح الخير! جاهز نتعلم شيئاً جديداً؟ ☀️','صباح النشاط! درس واحد اليوم يصنع الفرق.'],
  evening:['مساء الإبداع! لنكتب بعض الكود معاً 🌙','مساء الخير! خمس دقائق تعلّم أفضل من لا شيء.'],
  first:['أهلاً! أنا <b>نيلو</b> 💧 رفيقك في رحلة تعلّم الويب. لنبدأ أول درس!'],
  streak:n=>[`🔥 سلسلتك ${n} أيام! لا تقطعها اليوم.`,`${n} أيام متتالية 🔥 أنت تبني عادة المبرمجين!`],
  missed:['اشتقت لك! 👋 لنكمل من حيث توقفنا.','عودة موفقة! السلسلة تبدأ من جديد اليوم 💪'],
  lesson:['اقرأ الشرح بهدوء ثم جرّب بنفسك، أنا معك!','جرّب تعديل الأمثلة، هكذا تفهم أعمق 🔍','اكتب الكود بيدك بدل النسخ، يثبت في ذهنك أسرع ✍️'],
  project:['مشروع! هنا تظهر مهارتك الحقيقية 🚀 أنجزه بنداً بنداً.','وقت التطبيق العملي! لا تستعجل، تحقّق بعد كل خطوة.'],
  pass:['رائع! كودك يعمل تماماً 👏','أحسنت! أنت مبرمج حقيقي ✨','ممتاز! خطوة جديدة نحو الاحتراف 🚀','يا سلام! حللتها بنفسك 💪','هذا هو! استمر بهذا المستوى 🌟'],
  again:['حلّ متقن مرة أخرى! 👌','المراجعة تثبّت المعلومة، أحسنت!'],
  unit:t=>[`🎉 أنهيت وحدة «${t}» كاملة! أنا فخور بك.`],
  grad:['🎓 مبروك التخرج! لقد صرت مطوّر ويب. اكتب اسمك على شهادتك!'],
  streakUp:n=>[`🔥 ${n} أيام متتالية! استمر وستندهش من تقدمك.`],
  fail:['قريب جداً! راجع البنود الحمراء 👀','لا بأس، الأخطاء جزء من التعلم.','كل مبرمج يخطئ، المهم أن تحاول مرة أخرى 💪','ركّز على أول بند أحمر فقط، ثم تحقّق.'],
  failMany:['لا تستسلم! اقرأ «الخطأ الشائع» في الخلاصة، غالباً هو السبب 💡','خذ نفساً عميقاً 😌 ثم قارن كودك بالمثال في الشرح سطراً بسطر.','جرّب إعادة الكود للبداية وابدأ بخطوة واحدة صغيرة.'],
  error:['في الكود خطأ صغير. رسالة الخطأ تدلّك على مكانه 🔍','انتبه للأقواس وعلامات الاقتباس، غالباً المشكلة هناك.'],
  idle:['هل علقت؟ ابدأ بأول بند في قائمة التحقق 🙂','لا تخف من التجربة، يمكنك إعادة الكود للبداية دائماً.','جرّب سطراً واحداً فقط ثم اضغط تحقّق.'],
  play:['هنا ملعبك! جرّب أي فكرة تخطر لك 🎨','لا توجد أخطاء هنا، فقط تجارب! 🧪'],
  me:['كل نقطة تجمعها تقرّبك من شهادتك 🎓','تقدّمك رائع، لنكمل!'],
  tap:['أنا نيلو 💧 قطرة من النيل تحب البرمجة!','التكرار يصنع المبرمج. درس كل يوم!','هل تعلم؟ أول صفحة ويب نُشرت عام 1991 🌍','استمتع بالرحلة، كل خبير كان مبتدئاً يوماً ما.','اضغط عليّ مطوّلاً إن أردتني أهدأ 🤫'],
  quietOn:['حسناً، سأكون هادئاً 🤫 وأظهر فقط عند إنجازاتك.'],
  quietOff:['عدت للتشجيع! 🎉']
};

/* ── الرسم ── */
const SVG=`<svg viewBox="0 0 100 112" aria-hidden="true"><defs>
<linearGradient id="nlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FD8C6"/><stop offset=".55" stop-color="#12B5A6"/><stop offset="1" stop-color="#0E7C86"/></linearGradient></defs>
<g class="nilo-body">
<ellipse cx="38" cy="108" rx="9" ry="4" fill="#0B5E66"/><ellipse cx="62" cy="108" rx="9" ry="4" fill="#0B5E66"/>
<path class="nilo-arm-l" d="M17 74 Q7 78 5 88" fill="none" stroke="#0E8F92" stroke-width="6" stroke-linecap="round"/>
<path class="nilo-arm-r" d="M83 74 Q93 78 95 88" fill="none" stroke="#0E8F92" stroke-width="6" stroke-linecap="round"/>
<path d="M50 3C46 12 14 44 14 70a36 36 0 0 0 72 0C86 44 54 12 50 3Z" fill="url(#nlg)"/>
<path d="M30 48c4-9 10-17 15-23" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
<path d="M30 92q20 10 40 0" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>
<g class="nilo-eye eye-l"><ellipse cx="38" cy="64" rx="8.5" ry="10" fill="#fff"/><g class="nilo-pup"><circle cx="39" cy="66" r="5" fill="#0B1F2A"/><circle cx="41" cy="63.5" r="1.8" fill="#fff"/></g></g>
<g class="nilo-eye eye-r"><ellipse cx="62" cy="64" rx="8.5" ry="10" fill="#fff"/><g class="nilo-pup"><circle cx="63" cy="66" r="5" fill="#0B1F2A"/><circle cx="65" cy="63.5" r="1.8" fill="#fff"/></g></g>
<path class="wink" d="M55 66q7-6 14 0" fill="none" stroke="#0B1F2A" stroke-width="3" stroke-linecap="round"/>
<path class="brow" d="M31 53l13-4M56 49l13 4" stroke="#0B1F2A" stroke-width="2.6" stroke-linecap="round"/>
<ellipse class="nilo-cheek" cx="28" cy="79" rx="5.5" ry="3.2" fill="#FF8FA3" opacity=".55"/><ellipse class="nilo-cheek" cx="72" cy="79" rx="5.5" ry="3.2" fill="#FF8FA3" opacity=".55"/>
<path class="m m-happy" d="M42 80q8 8 16 0" fill="none" stroke="#0B1F2A" stroke-width="3" stroke-linecap="round"/>
<path class="m m-cheer" d="M40 78h20q0 12-10 12t-10-12Z" fill="#0B1F2A"/><path class="m m-cheer" d="M44 86q6-4 12 0q-2 4-6 4t-6-4Z" fill="#FF6B81"/>
<path class="m m-oops" d="M43 84q7-5 14 0" fill="none" stroke="#0B1F2A" stroke-width="3" stroke-linecap="round"/>
<path class="m m-think" d="M44 83q6 2 13-2" fill="none" stroke="#0B1F2A" stroke-width="3" stroke-linecap="round"/>
<ellipse class="m m-sleep" cx="50" cy="83" rx="3.5" ry="2.5" fill="#0B1F2A"/>
</g>
<g class="stars" fill="#F5B83D"><path d="M12 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M88 22l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/><path d="M80 44l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/></g>
<g class="zz" fill="#5E7480" font-family="system-ui" font-weight="900"><text x="72" y="30" font-size="12">z</text><text x="82" y="18" font-size="16">z</text></g>
</svg>`;

const root=document.createElement('div');
root.className='nilo peek mood-happy';
root.innerHTML=`<button class="nilo-btn" aria-label="نيلو، رفيقك في التعلم">${SVG}</button><div class="nilo-bub" role="status" aria-live="polite"><button class="nilo-x" aria-label="إغلاق">×</button><span class="nilo-t"></span></div>`;
const btn=root.querySelector('.nilo-btn'),txt=root.querySelector('.nilo-t');

let hideT,animT,lastSay=0,fails=0,view={n:'home'},idleT,idleCount=0,typing=false;

function setMood(m){root.className=root.className.replace(/\bmood-\w+/g,'')+' mood-'+(m||'happy')}
function play(a){
  root.classList.remove('a-jump','a-shake','a-wave','a-cheer');
  if(!a)return;void root.offsetWidth;root.classList.add('a-'+a);
  clearTimeout(animT);animT=setTimeout(()=>root.classList.remove('a-'+a),2000);
}
function say(text,o){
  o=o||{};
  if(typing&&!o.force)return;
  if(P.quiet&&!o.important)return;
  clearTimeout(hideT);
  txt.innerHTML=text;setMood(o.mood);
  root.classList.remove('peek','gone');root.classList.add('talk');
  play(o.anim);lastSay=Date.now();
  hideT=setTimeout(rest,o.ms||Math.min(7000,2600+text.length*45));
}
function rest(){clearTimeout(hideT);root.classList.remove('talk');setMood('happy');root.classList.add('peek')}

function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=document.createElement('div');c.className='nilo-conf';
  const cols=['#12B5A6','#F5B83D','#0E7C86','#FF8FA3','#7BD389'];
  for(let i=0;i<36;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.background=cols[i%cols.length];p.style.animationDuration=(1.6+Math.random()*1.4)+'s';p.style.animationDelay=Math.random()*.4+'s';c.appendChild(p)}
  document.body.appendChild(c);setTimeout(()=>c.remove(),3600);
}

/* ── الخمول داخل الدرس ── */
function armIdle(){
  clearTimeout(idleT);
  if(view.n!=='lesson'||idleCount>=2)return;
  idleT=setTimeout(()=>{idleCount++;say(pick(L.idle),{mood:'think',anim:'wave'});armIdle()},idleCount?120000:50000);
}
['pointerdown','keydown','input'].forEach(e=>document.addEventListener(e,armIdle,{passive:true}));

/* إخفاء كامل أثناء الكتابة (لوحة المفاتيح على الهاتف) */
document.addEventListener('focusin',e=>{if(e.target.matches('textarea,input,[contenteditable]')){typing=true;rest();root.classList.add('gone')}});
document.addEventListener('focusout',()=>{typing=false;root.classList.remove('gone')});

/* ── الضغط والضغط المطوّل ── */
let pressT,longPressed=false;
btn.addEventListener('pointerdown',()=>{longPressed=false;pressT=setTimeout(()=>{longPressed=true;P.quiet=!P.quiet;persist();say(pick(P.quiet?L.quietOn:L.quietOff),{mood:P.quiet?'wink':'cheer',anim:P.quiet?null:'jump',important:true})},650)});
['pointerup','pointerleave','pointercancel'].forEach(e=>btn.addEventListener(e,()=>clearTimeout(pressT)));
btn.addEventListener('click',()=>{
  if(longPressed)return;
  if(root.classList.contains('talk'))return rest();
  say(pick(L.tap),{mood:pick(['happy','wink','cheer']),anim:pick(['wave','jump']),important:true});
});
btn.addEventListener('contextmenu',e=>e.preventDefault());
root.querySelector('.nilo-x').addEventListener('click',rest);

/* ── أحداث التطبيق ── */
function event(name,d){
  d=d||{};
  if(name==='view'){
    view=d;fails=0;idleCount=0;armIdle();
    if(Date.now()-lastSay<1500)return;
    if(d.n==='lesson'){
      const s=appState();if(s.done&&s.done[d.id])return rest();
      const k='l_'+d.id;if(P.seen[k])return rest();P.seen[k]=1;persist();
      const proj=/^p[A-Z]|^cP$|^j11$/.test(d.id||'');
      if(proj||Math.random()<.5)setTimeout(()=>say(pick(proj?L.project:L.lesson),{mood:proj?'cheer':'happy',anim:'wave'}),700);
      else rest();
    }else if(d.n==='play'&&!P.seen.play){P.seen.play=1;persist();say(pick(L.play),{mood:'wink',anim:'wave'})}
    else if(d.n==='me'&&Math.random()<.4)say(pick(L.me),{mood:'happy'});
    else rest();
  }
  else if(name==='pass'){
    fails=0;
    if(d.all&&d.first){confetti();return say(pick(L.grad),{mood:'cheer',anim:'jump',important:true,ms:7000})}
    if(d.unit&&d.first){confetti();return say(pick(L.unit(d.unitTitle||'')),{mood:'cheer',anim:'jump',important:true,ms:6000})}
    if(d.first&&d.streakUp&&d.streak>1)return say(pick(L.streakUp(d.streak)),{mood:'cheer',anim:'jump',important:true});
    say(pick(d.first?L.pass:L.again),{mood:'cheer',anim:d.first?'jump':'cheer',important:d.first});
  }
  else if(name==='fail'){
    fails++;
    say(pick(fails>=3?L.failMany:L.fail),{mood:fails>=3?'think':'oops',anim:fails===1?'shake':null});
  }
  else if(name==='error'){fails++;say(pick(L.error),{mood:'think',anim:'shake'})}
}

/* ── التحية عند فتح التطبيق ── */
function greet(){
  const s=appState(),today=new Date().toDateString(),yest=new Date(Date.now()-864e5).toDateString();
  const n=Object.keys(s.done||{}).length;
  let t,m='happy',a='wave';
  if(!n&&!P.seen.first){P.seen.first=1;persist();t=pick(L.first);a='jump';m='cheer'}
  else if(s.streak>1&&(s.last===today||s.last===yest)){t=pick(L.streak(s.streak));m='cheer'}
  else if(n&&s.last&&s.last!==today&&s.last!==yest)t=pick(L.missed);
  else t=pick(new Date().getHours()<15?L.morning:L.evening);
  say(t,{mood:m,anim:a,important:!n});
}

function mount(){
  document.body.appendChild(root);
  root.classList.add('a-pop');setTimeout(()=>root.classList.remove('a-pop'),600);
  setTimeout(greet,1400);
}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);

window.Mascot={event,say,rest,confetti,get quiet(){return P.quiet},set quiet(v){P.quiet=!!v;persist()}};
})();
