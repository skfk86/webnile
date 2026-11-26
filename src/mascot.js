/* ───── نيلو: الشخصية المشجعة في ويب نايل ─────
   وحدة مستقلة. التطبيق يكلّمها فقط عبر:
     Mascot.event(name, data)   // view | pass | fail | error
     Mascot.say(text, {mood, anim, ms})
   المزاج: happy | cheer | sad | think | wink | sleep
   الحركة: jump | shake | wave | nod
*/
(function(){
'use strict';
const KEY='webnile_mascot';
let P={quiet:false,seen:{}};
try{Object.assign(P,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const appState=()=>{try{return JSON.parse(localStorage.getItem('webnile2')||'{}')}catch(e){return{}}};
const RM=matchMedia('(prefers-reduced-motion: reduce)');

/* ── العبارات ── */
const L={
  morning:['صباح الخير! جاهز نتعلم شيئاً جديداً؟ ☀️','صباح النشاط! درس واحد اليوم يصنع الفرق.'],
  evening:['مساء الإبداع! لنكتب بعض الكود معاً 🌙','مساء الخير! خمس دقائق تعلّم أفضل من لا شيء.'],
  first:['أهلاً! أنا نيلو 💧 رفيقك في رحلة تعلّم الويب. لنبدأ أول درس معاً!'],
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

/* ── الرسم (SVG متجه بالكامل) ── */
const EYE=(x,s)=>`<g class="n-eye n-eye-${s}">
<ellipse cx="${x}" cy="84" rx="11.5" ry="13.5" fill="#fff"/>
<ellipse cx="${x}" cy="84" rx="11.5" ry="13.5" fill="none" stroke="#0A5F68" stroke-opacity=".35" stroke-width="1.2"/>
<g clip-path="url(#nclip-${s})">
<g class="n-look"><circle cx="${x+1}" cy="86" r="7.6" fill="url(#niris)"/><circle cx="${x+1}" cy="86" r="4.2" fill="#06161D"/><circle cx="${x+3.6}" cy="82.6" r="2.4" fill="#fff"/><circle cx="${x-1.6}" cy="89.2" r="1.1" fill="#fff" fill-opacity=".85"/></g>
<rect class="n-lid" x="${x-13}" y="70" width="26" height="28" fill="url(#nlid)"/>
</g></g>
<path class="n-hap n-hap-${s}" d="M${x-10} 88q10-12 20 0" fill="none" stroke="#06161D" stroke-width="3.6" stroke-linecap="round"/>`;
const SVG=`<svg viewBox="0 0 120 150" aria-hidden="true"><defs>
<radialGradient id="nbody" cx=".38" cy=".42" r=".75"><stop offset="0" stop-color="#5BE6D4"/><stop offset=".45" stop-color="#17BFAE"/><stop offset=".85" stop-color="#0C8C93"/><stop offset="1" stop-color="#0A6F78"/></radialGradient>
<linearGradient id="nlid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22C9B6"/><stop offset="1" stop-color="#16B3A5"/></linearGradient>
<radialGradient id="niris" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3B8FA0"/><stop offset="1" stop-color="#0B3D4A"/></radialGradient>
<linearGradient id="nlimb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14A79E"/><stop offset="1" stop-color="#0B7E86"/></linearGradient>
<clipPath id="nclip-l"><ellipse cx="44" cy="84" rx="11.5" ry="13.5"/></clipPath>
<clipPath id="nclip-r"><ellipse cx="76" cy="84" rx="11.5" ry="13.5"/></clipPath>
</defs>
<ellipse class="n-shadow" cx="60" cy="146" rx="30" ry="4.5" fill="#0B1F2A" opacity=".18"/>
<g class="n-rig">
<ellipse cx="46" cy="139" rx="10.5" ry="5" fill="#0A6A73"/><ellipse cx="74" cy="139" rx="10.5" ry="5" fill="#0A6A73"/>
<g class="n-body">
<path d="M60 5C55 18 16 56 16 91a44 44 0 0 0 88 0C104 56 65 18 60 5Z" fill="url(#nbody)"/>
<path d="M60 5C55 18 16 56 16 91a44 44 0 0 0 88 0C104 56 65 18 60 5Z" fill="none" stroke="#08606A" stroke-opacity=".35" stroke-width="1.6"/>
<path d="M27 118a44 44 0 0 0 66 0" fill="none" stroke="#06525B" stroke-opacity=".22" stroke-width="6" stroke-linecap="round"/>
<path d="M34 54c5-11 12-21 19-30" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="5.5" stroke-linecap="round"/>
<circle cx="30" cy="66" r="3" fill="#fff" fill-opacity=".6"/>
<path d="M88 76q4 8 3 18" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>
<g class="n-face">
<path class="n-brow n-brow-l" d="M35 64q9-5 18-1" fill="none" stroke="#06161D" stroke-width="3.4" stroke-linecap="round"/>
<path class="n-brow n-brow-r" d="M67 63q9-4 18 1" fill="none" stroke="#06161D" stroke-width="3.4" stroke-linecap="round"/>
${EYE(44,'l')}${EYE(76,'r')}
<ellipse cx="31" cy="104" rx="6.5" ry="3.8" fill="#FF8FB0" opacity=".8"/><ellipse cx="89" cy="104" rx="6.5" ry="3.8" fill="#FF8FB0" opacity=".8"/>
<g class="n-mouth">
<path data-m="smile" d="M49 106q11 13 22 0q-11 5-22 0Z" fill="#06161D" stroke="#06161D" stroke-width="2" stroke-linejoin="round"/>
<g data-m="a"><path d="M48 105q12-2 24 0q-1 17-12 17t-12-17Z" fill="#3A0D16"/><path d="M51 105.6q9-1.2 18 0l-.8 3.2q-8.2 1-16.4 0Z" fill="#fff"/><ellipse cx="60" cy="118" rx="6.5" ry="3.6" fill="#FF6F86"/></g>
<g data-m="e"><path d="M50 106q10-2 20 0q-2 9-10 9t-10-9Z" fill="#3A0D16"/><ellipse cx="60" cy="112.6" rx="5" ry="2.4" fill="#FF6F86"/></g>
<g data-m="o"><ellipse cx="60" cy="111" rx="6" ry="7.4" fill="#3A0D16"/><ellipse cx="60" cy="115" rx="3.8" ry="2.4" fill="#FF6F86"/></g>
<ellipse data-m="s" cx="60" cy="109" rx="6.5" ry="3.6" fill="#3A0D16"/>
<g data-m="cheer"><path d="M45 103h30q-1 21-15 21t-15-21Z" fill="#3A0D16"/><path d="M48 103.5h24l-1 4.2q-11 1.4-22 0Z" fill="#fff"/><ellipse cx="60" cy="119" rx="8" ry="4.4" fill="#FF6F86"/></g>
<path data-m="sad" d="M50 115q10-9 20 0" fill="none" stroke="#06161D" stroke-width="3.4" stroke-linecap="round"/>
<path data-m="think" d="M52 112q7 2 15-3" fill="none" stroke="#06161D" stroke-width="3.4" stroke-linecap="round"/>
</g>
</g>
</g>
<g class="n-arm-l"><path d="M22 100q-9 6-12 18" fill="none" stroke="url(#nlimb)" stroke-width="7" stroke-linecap="round"/><circle cx="10" cy="119" r="6.6" fill="#13A99F"/><circle cx="8.4" cy="117" r="2.2" fill="#fff" fill-opacity=".35"/></g>
<g class="n-arm-r"><path d="M98 100q9 6 12 18" fill="none" stroke="url(#nlimb)" stroke-width="7" stroke-linecap="round"/><circle cx="110" cy="119" r="6.6" fill="#13A99F"/><circle cx="108.4" cy="117" r="2.2" fill="#fff" fill-opacity=".35"/></g>
</g>
<g class="n-fx">
<g class="fx-star" fill="#F5B83D"><path d="M8 40l2.6 6 6 2.6-6 2.6-2.6 6-2.6-6-6-2.6 6-2.6z"/><path d="M108 26l2 4.6 4.6 2-4.6 2-2 4.6-2-4.6-4.6-2 4.6-2z"/><path d="M100 56l1.4 3.2 3.2 1.4-3.2 1.4-1.4 3.2-1.4-3.2-3.2-1.4 3.2-1.4z"/><path d="M20 16l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z"/></g>
<g class="fx-tear"><path d="M33 98q-3.5 5-3.5 7.5a3.5 3.5 0 0 0 7 0q0-2.5-3.5-7.5Z" fill="#9EE8FF" stroke="#4FB6D6" stroke-width=".8"/></g>
<g class="fx-sweat"><path d="M95 58q-3 4.5-3 6.6a3 3 0 0 0 6 0q0-2.1-3-6.6Z" fill="#BDEFFF" stroke="#4FB6D6" stroke-width=".8"/></g>
<g class="fx-dots" fill="#5E7480"><circle cx="96" cy="40" r="3"/><circle cx="105" cy="30" r="3.8"/><circle cx="114" cy="18" r="4.6"/></g>
</g>
</svg>`;

const REST={happy:'smile',cheer:'cheer',sad:'sad',think:'think',wink:'smile',sleep:'s'};
const EYES={cheer:'h',wink:'w'};

const root=document.createElement('div');
root.className='nilo peek';
root.innerHTML=`<button class="nilo-btn" aria-label="نيلو، رفيقك في التعلم">${SVG}</button><div class="nilo-bub"><button class="nilo-x" aria-label="إغلاق">×</button><b class="nilo-name">نيلو</b><span class="nilo-t" aria-hidden="true"></span><span class="nilo-sr" role="status" aria-live="polite"></span></div>`;
const btn=root.querySelector('.nilo-btn'),txt=root.querySelector('.nilo-t'),sr=root.querySelector('.nilo-sr');
const looks=()=>root.querySelectorAll('.n-look');

let mood='happy',hideT,animT,typeT,lastSay=0,fails=0,view={n:'home'},idleT,idleCount=0,typing=false;

function setMood(m){mood=m||'happy';root.dataset.mood=mood;root.dataset.mouth=REST[mood]||'smile';root.dataset.eyes=EYES[mood]||'n'}
function play(a){
  root.classList.remove('a-jump','a-shake','a-wave','a-nod');
  if(!a)return;void root.offsetWidth;root.classList.add('a-'+a);
  clearTimeout(animT);animT=setTimeout(()=>root.classList.remove('a-'+a),1800);
}

/* ── العيون: رمش طبيعي ونظرات ── */
function blink(){root.classList.add('blink');setTimeout(()=>root.classList.remove('blink'),130)}
(function loopBlink(){setTimeout(()=>{if(mood!=='sleep'){blink();if(Math.random()<.25)setTimeout(blink,260)}loopBlink()},2200+Math.random()*3200)})();
function look(dx,dy){looks().forEach(g=>g.style.transform=`translate(${dx}px,${dy}px)`)}
function lookAt(x,y){
  const r=btn.getBoundingClientRect();if(!r.width)return;
  const cx=r.left+r.width/2,cy=r.top+r.height*.56,vx=x-cx,vy=y-cy,d=Math.hypot(vx,vy)||1,k=Math.min(1,d/160);
  look(vx/d*3.6*k,vy/d*3.2*k);
}
let lookT;
document.addEventListener('pointerdown',e=>{lookAt(e.clientX,e.clientY);clearTimeout(lookT);lookT=setTimeout(()=>look(0,0),1600)},{passive:true});
document.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){lookAt(e.clientX,e.clientY)}},{passive:true});
(function glance(){setTimeout(()=>{if(!root.classList.contains('typing')&&mood!=='think'){look((Math.random()-.5)*6,(Math.random()-.5)*4);setTimeout(()=>look(0,0),900)}glance()},4000+Math.random()*4000)})();

/* ── الكلام: كتابة متتابعة مع حركة فم متزامنة ── */
const VOWEL={'ا':'a','آ':'a','أ':'a','إ':'e','ى':'a','و':'o','ؤ':'o','ي':'e','ئ':'e','ه':'a','ع':'a','ح':'e'};
function mouthFor(ch){
  if(/[\s.,!؟?،:«»()\-]/.test(ch))return REST[mood]==='cheer'?'s':'smile';
  return VOWEL[ch]||pick(['s','e','s','a','o']);
}
function type(text,done){
  clearTimeout(typeT);
  const chars=Array.from(text);
  if(RM.matches){txt.textContent=text;return done()}
  let i=0;txt.textContent='';root.classList.add('typing','talking');
  (function step(){
    if(i>=chars.length){root.classList.remove('typing','talking');root.dataset.mouth=REST[mood];return done()}
    const ch=chars[i++];txt.textContent+=ch;root.dataset.mouth=mouthFor(ch);
    typeT=setTimeout(step,/[.!؟?،]/.test(ch)?160:/\s/.test(ch)?55:42);
  })();
}
function finishTyping(){if(!root.classList.contains('typing'))return false;clearTimeout(typeT);txt.textContent=sr.textContent;root.classList.remove('typing','talking');root.dataset.mouth=REST[mood];schedRest(sr.textContent);return true}
function schedRest(text){clearTimeout(hideT);hideT=setTimeout(rest,2600+text.length*40)}

function say(text,o){
  o=o||{};
  if(typing&&!o.force)return;
  if(P.quiet&&!o.important)return;
  clearTimeout(hideT);
  setMood(o.mood);sr.textContent=text;
  root.classList.remove('peek','gone');root.classList.add('talk');
  play(o.anim);lastSay=Date.now();look(1.5,-.5);
  // في الاحتفال تبقى العينان مبتسمتين، وفي غيره تتحرك الشفاه مع النص
  type(text,()=>schedRest(text));
}
function rest(){clearTimeout(hideT);clearTimeout(typeT);root.classList.remove('talk','typing','talking');setMood('happy');root.classList.add('peek')}

function confetti(){
  if(RM.matches)return;
  const c=document.createElement('div');c.className='nilo-conf';
  const cols=['#12B5A6','#F5B83D','#0E7C86','#FF8FA3','#7BD389'];
  for(let i=0;i<40;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.background=cols[i%cols.length];p.style.animationDuration=(1.6+Math.random()*1.4)+'s';p.style.animationDelay=Math.random()*.4+'s';c.appendChild(p)}
  document.body.appendChild(c);setTimeout(()=>c.remove(),3600);
}

/* ── الخمول داخل الدرس ── */
function armIdle(){
  clearTimeout(idleT);
  if(view.n!=='lesson'||idleCount>=2)return;
  idleT=setTimeout(()=>{idleCount++;say(pick(L.idle),{mood:'think',anim:'wave'});armIdle()},idleCount?120000:50000);
}
['pointerdown','keydown','input'].forEach(e=>document.addEventListener(e,armIdle,{passive:true}));

/* إخفاء كامل أثناء الكتابة في المحرر (لوحة المفاتيح على الهاتف) */
document.addEventListener('focusin',e=>{if(e.target.matches('textarea,input,[contenteditable]')){typing=true;rest();root.classList.add('gone')}});
document.addEventListener('focusout',()=>{typing=false;root.classList.remove('gone')});

/* ── اللمس والضغط المطوّل ── */
let pressT,longPressed=false;
btn.addEventListener('pointerdown',()=>{longPressed=false;pressT=setTimeout(()=>{longPressed=true;P.quiet=!P.quiet;persist();say(pick(P.quiet?L.quietOn:L.quietOff),{mood:P.quiet?'wink':'cheer',anim:P.quiet?null:'jump',important:true})},650)});
['pointerup','pointerleave','pointercancel'].forEach(e=>btn.addEventListener(e,()=>clearTimeout(pressT)));
btn.addEventListener('click',()=>{
  if(longPressed)return;
  if(finishTyping())return;
  if(root.classList.contains('talk'))return rest();
  say(pick(L.tap),{mood:pick(['happy','wink','cheer']),anim:pick(['wave','jump','nod']),important:true});
});
btn.addEventListener('contextmenu',e=>e.preventDefault());
root.querySelector('.nilo-bub').addEventListener('click',e=>{if(e.target.closest('.nilo-x'))return rest();finishTyping()});

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
    else if(d.n==='me'&&Math.random()<.4)say(pick(L.me),{mood:'happy',anim:'nod'});
    else rest();
  }
  else if(name==='pass'){
    fails=0;
    if(d.all&&d.first){confetti();return say(pick(L.grad),{mood:'cheer',anim:'jump',important:true})}
    if(d.unit&&d.first){confetti();return say(pick(L.unit(d.unitTitle||'')),{mood:'cheer',anim:'jump',important:true})}
    if(d.first&&d.streakUp&&d.streak>1)return say(pick(L.streakUp(d.streak)),{mood:'cheer',anim:'jump',important:true});
    say(pick(d.first?L.pass:L.again),{mood:'cheer',anim:'jump',important:d.first});
  }
  else if(name==='fail'){
    fails++;
    say(pick(fails>=3?L.failMany:L.fail),{mood:fails>=3?'think':'sad',anim:fails===1?'shake':null});
  }
  else if(name==='error'){fails++;say(pick(L.error),{mood:'think',anim:'shake'})}
}

/* ── التحية عند فتح التطبيق ── */
function greet(){
  const s=appState(),today=new Date().toDateString(),yest=new Date(Date.now()-864e5).toDateString();
  const n=Object.keys(s.done||{}).length;
  let t,m='happy',a='wave';
  if(!n&&!P.seen.first){P.seen.first=1;persist();t=pick(L.first);a='jump';m='cheer'}
  else if(s.streak>1&&(s.last===today||s.last===yest)){t=pick(L.streak(s.streak));m='cheer';a='jump'}
  else if(n&&s.last&&s.last!==today&&s.last!==yest)t=pick(L.missed);
  else t=pick(new Date().getHours()<15?L.morning:L.evening);
  say(t,{mood:m,anim:a,important:!n});
}

function mount(){
  setMood('happy');
  document.body.appendChild(root);
  root.classList.add('enter');setTimeout(()=>root.classList.remove('enter'),900);
  setTimeout(greet,1400);
}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);

window.Mascot={event,say,rest,confetti,get quiet(){return P.quiet},set quiet(v){P.quiet=!!v;persist()}};
})();
