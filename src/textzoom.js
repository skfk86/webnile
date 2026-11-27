/* ويب نايل — دعم حجم الخط في النظام (تكبير/تصغير الخط من إعدادات الهاتف)
 * أندرويد يكبّر نص WebView تلقائياً حسب حجم خط النظام (textZoom).
 * هنا نقرأ النسبة من إضافة @capacitor/text-zoom، نثبّتها ضمن حدود آمنة،
 * ونكتبها في --tz على <html> مع أصناف tz-s / tz-l / tz-xl
 * كي يكيّف textzoom.css التخطيط ويحدّ من تضخّم العناوين وعناصر الواجهة. */
(function(){
  var R=document.documentElement,MIN=.85,MAX=2,KEY='wn-tz';
  function clamp(z){z=+z;return z>0?Math.min(MAX,Math.max(MIN,Math.round(z*100)/100)):1}
  function apply(z){
    z=clamp(z);window.__tz=z;
    R.style.setProperty('--tz',z);
    R.classList.toggle('tz-s',z<.95);R.classList.toggle('tz-l',z>=1.15);R.classList.toggle('tz-xl',z>=1.45);
    try{localStorage.setItem(KEY,z)}catch(e){}
    return z;
  }
  // القياس الفعلي: textZoom يكبّر حجم الخط المحسوب، فعنصر عرضه 10em بخط 20px يصبح أعرض من 200px
  function measure(){
    var d=document.createElement('div');
    d.style.cssText='position:absolute;visibility:hidden;pointer-events:none;top:0;font-size:20px;width:10em;height:0;padding:0;border:0';
    (document.body||R).appendChild(d);var z=d.getBoundingClientRect().width/200;d.remove();return z||1;
  }
  function plugin(){var C=window.Capacitor;return C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.TextZoom}
  var busy=null;
  function sync(){
    if(busy)return busy;
    busy=(async function(){
      var T=plugin();
      if(T){try{
        var p=(await T.getPreferred()).value,z=clamp(p);
        // نثبّت نسبة WebView صراحةً حتى لا تتجاوز الحدود ولتتبع أي تغيير في الإعدادات عند العودة للتطبيق
        await T.set({value:z});
        return apply(z);
      }catch(e){}}
      return apply(measure());
    })().finally(function(){busy=null});
    return busy;
  }
  // قيمة آخر تشغيل فوراً لتجنّب وميض التخطيط، ثم المزامنة الفعلية
  try{var last=localStorage.getItem(KEY);if(last)apply(last)}catch(e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
  try{var A=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.App;if(A&&A.addListener)A.addListener('resume',sync)}catch(e){}
  document.addEventListener('visibilitychange',function(){if(!document.hidden)sync()});
  window.TextSize={sync:sync,get:function(){return window.__tz||1}};
})();
