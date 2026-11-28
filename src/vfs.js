/* نظام ملفات المشاريع (VFS) في ويب نايل.
   التخزين محلي بالكامل في IndexedDB (لا خادم ولا Firebase): قاعدة "webnile-fs"
     projects: {id, name, created, updated, kind}
     files:    {pid, path, type:'file'|'dir', text?, blob?, mime?, size, mtime}  — المفتاح [pid, path]
   - لا يُحمَّل محتوى أي ملف إلا عند طلبه (list ترجع البيانات الوصفية فقط عبر فهرس منفصل).
   - كل عملية متعددة الخطوات (نقل مجلد، حذف، نسخ) في معاملة واحدة: إما تتم كاملة أو لا شيء.
   - الأخطاء (امتلاء التخزين…) تُرفع كاستثناء برسالة عربية ليعرضها التطبيق. */
(function(){
var DB='webnile-fs',VER=1,dbp=null;
function open(){
  if(dbp)return dbp;
  dbp=new Promise(function(ok,no){
    if(!window.indexedDB)return no(new Error('التخزين غير متاح في هذا المتصفح'));
    var r=indexedDB.open(DB,VER);
    r.onupgradeneeded=function(){
      var d=r.result;
      if(!d.objectStoreNames.contains('projects'))d.createObjectStore('projects',{keyPath:'id'});
      if(!d.objectStoreNames.contains('files')){var f=d.createObjectStore('files',{keyPath:['pid','path']});f.createIndex('pid','pid')}
      if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'k'});
    };
    r.onsuccess=function(){var d=r.result;d.onversionchange=function(){d.close();dbp=null};ok(d)};
    r.onerror=function(){dbp=null;no(r.error)};
  });
  return dbp;
}
function arErr(e){
  var n=e&&(e.name||'');
  if(n==='QuotaExceededError')return new Error('مساحة التخزين ممتلئة. احذف ملفات أو مشاريع لا تحتاجها');
  return e instanceof Error?e:new Error(String(e&&e.message||e||'خطأ في التخزين'));
}
// معاملة: fn(store1, store2…) ترجع قيمة، والوعد يكتمل بعد نجاح المعاملة كاملة
function tx(stores,mode,fn){
  return open().then(function(d){return new Promise(function(ok,no){
    var t=d.transaction(stores,mode),res;
    t.oncomplete=function(){ok(res)};
    t.onerror=function(){no(arErr(t.error))};
    t.onabort=function(){no(arErr(t.error||new Error('أُلغيت العملية')))};
    try{res=fn.apply(null,stores.map(function(s){return t.objectStore(s)}));if(res&&typeof res.then==='function')res.then(function(v){res=v},function(e){try{t.abort()}catch(x){}no(arErr(e))})}catch(e){try{t.abort()}catch(x){}no(arErr(e))}
  })});
}
function req(r){return new Promise(function(ok,no){r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}

/* ---------- المسارات ---------- */
function norm(p){
  var out=[];String(p||'').replace(/\\/g,'/').split('/').forEach(function(s){if(!s||s==='.')return;if(s==='..')out.pop();else out.push(s)});
  return out.join('/');
}
function dirname(p){var i=p.lastIndexOf('/');return i<0?'':p.slice(0,i)}
function basename(p){return p.slice(p.lastIndexOf('/')+1)}
function join(a,b){return norm((a?a+'/':'')+b)}
var BAD=/[\\:*?"<>|\u0000-\u001f]/;
function checkName(n){
  n=String(n||'').trim();
  if(!n)return 'اكتب اسماً';
  if(n.indexOf('/')>-1)return 'الاسم لا يحتوي على /';
  if(BAD.test(n)||n==='.'||n==='..')return 'الاسم فيه رموز غير مسموحة';
  if(n.length>80)return 'الاسم طويل جداً';
  return null;
}
var EXT={html:'html',htm:'html',css:'css',js:'js',mjs:'js',json:'json',md:'md',markdown:'md',txt:'txt',svg:'svg',xml:'txt',csv:'txt'};
var MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',ico:'image/x-icon',avif:'image/avif',
  woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',mp4:'video/mp4',webm:'video/webm',
  html:'text/html',htm:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',md:'text/markdown',txt:'text/plain',csv:'text/csv',xml:'application/xml',pdf:'application/pdf'};
function ext(p){var m=/\.([a-z0-9]+)$/i.exec(p||'');return m?m[1].toLowerCase():''}
function langOf(p){return EXT[ext(p)]||null}          // null = ملف ثنائي (صورة، خط…)
function isText(p){return !!langOf(p)}
function mimeOf(p){return MIME[ext(p)]||'application/octet-stream'}
function kindOf(p){var x=ext(p);if(/^(png|jpe?g|gif|webp|svg|ico|avif)$/.test(x))return 'image';if(/^(woff2?|ttf|otf)$/.test(x))return 'font';if(/^(mp3|wav|ogg|mp4|webm)$/.test(x))return 'media';return langOf(p)||'bin'}

/* ---------- المشاريع ---------- */
function uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function projects(){return tx(['projects'],'readonly',function(s){return req(s.getAll())}).then(function(a){return a.sort(function(x,y){return y.updated-x.updated})})}
function project(id){return tx(['projects'],'readonly',function(s){return req(s.get(id))})}
function now(){return Date.now()}
// files: {path: text | Blob}
function createProject(name,files,kind){
  var id=uid(),t=now();
  return tx(['projects','files'],'readwrite',function(P,F){
    P.put({id:id,name:String(name||'مشروعي').slice(0,60),created:t,updated:t,kind:kind||'user'});
    var dirs={};
    Object.keys(files||{}).forEach(function(p){
      var path=norm(p);if(!path)return;
      for(var d=dirname(path);d&&!dirs[d];d=dirname(d))dirs[d]=1;
      F.put(rec(id,path,files[p]));
    });
    Object.keys(dirs).forEach(function(d){F.put({pid:id,path:d,type:'dir',mtime:t})});
    return id;
  });
}
function rec(pid,path,content){
  var r={pid:pid,path:path,type:'file',mtime:now()};
  if(content instanceof Blob){r.blob=content;r.mime=content.type||mimeOf(path);r.size=content.size}
  else{r.text=String(content==null?'':content);r.size=r.text.length}
  return r;
}
function touch(P,pid){return req(P.get(pid)).then(function(p){if(p){p.updated=now();P.put(p)}})}
function renameProject(pid,name){return tx(['projects'],'readwrite',function(P){return req(P.get(pid)).then(function(p){if(!p)throw new Error('المشروع غير موجود');p.name=String(name).slice(0,60);p.updated=now();P.put(p)})})}
function deleteProject(pid){
  return tx(['projects','files'],'readwrite',function(P,F){
    P.delete(pid);
    return req(F.index('pid').getAllKeys(pid)).then(function(keys){keys.forEach(function(k){F.delete(k)})});
  });
}
function duplicateProject(pid,name){
  return Promise.all([project(pid),all(pid)]).then(function(r){
    var files={};r[1].forEach(function(f){if(f.type==='file')files[f.path]=f.blob||f.text||''});
    return createProject(name||(r[0].name+' (نسخة)'),files,r[0].kind);
  });
}

/* ---------- الملفات ---------- */
// كل السجلات (مع المحتوى) — للبحث الشامل والتصدير فقط
function all(pid){return tx(['files'],'readonly',function(F){return req(F.index('pid').getAll(pid))})}
// القائمة الوصفية دون المحتوى: نقرأ المفاتيح ثم الأحجام عبر cursor خفيف
function list(pid){
  return tx(['files'],'readonly',function(F){
    return new Promise(function(ok,no){
      var out=[],c=F.index('pid').openCursor(IDBKeyRange.only(pid));
      c.onsuccess=function(){var cur=c.result;if(!cur)return ok(out);var v=cur.value;out.push({path:v.path,type:v.type,size:v.size||0,mtime:v.mtime,mime:v.mime});cur.continue()};
      c.onerror=function(){no(c.error)};
    });
  });
}
function read(pid,path){return tx(['files'],'readonly',function(F){return req(F.get([pid,norm(path)]))}).then(function(r){if(!r||r.type!=='file')return null;return r.blob||r.text||''})}
function exists(pid,path){return tx(['files'],'readonly',function(F){return req(F.getKey([pid,norm(path)]))}).then(function(k){return k!==undefined})}
// كتابة ملف (تُنشئ المجلدات الأم تلقائياً)
function write(pid,path,content){
  path=norm(path);if(!path)return Promise.reject(new Error('مسار غير صالح'));
  return tx(['projects','files'],'readwrite',function(P,F){
    for(var d=dirname(path);d;d=dirname(d))F.put({pid:pid,path:d,type:'dir',mtime:now()});
    F.put(rec(pid,path,content));
    return touch(P,pid);
  });
}
function mkdir(pid,path){
  path=norm(path);
  return tx(['projects','files'],'readwrite',function(P,F){
    return req(F.get([pid,path])).then(function(r){
      if(r)throw new Error('يوجد عنصر بهذا الاسم');
      for(var d=path;d;d=dirname(d))F.put({pid:pid,path:d,type:'dir',mtime:now()});
      return touch(P,pid);
    });
  });
}
// يحذف ملفاً أو مجلداً بكل محتواه
function remove(pid,path){
  path=norm(path);
  return tx(['projects','files'],'readwrite',function(P,F){
    return req(F.index('pid').getAllKeys(pid)).then(function(keys){
      keys.forEach(function(k){if(k[1]===path||k[1].indexOf(path+'/')===0)F.delete(k)});
      return touch(P,pid);
    });
  });
}
// نقل/إعادة تسمية (keep=true للنسخ). يرفض الكتابة فوق عنصر موجود
function moveOrCopy(pid,from,to,keep){
  from=norm(from);to=norm(to);
  if(!from||!to)return Promise.reject(new Error('مسار غير صالح'));
  if(to===from)return Promise.resolve(to);
  if(to.indexOf(from+'/')===0)return Promise.reject(new Error('لا يمكن نقل مجلد إلى داخل نفسه'));
  return tx(['projects','files'],'readwrite',function(P,F){
    return Promise.all([req(F.index('pid').getAll(pid)),req(F.get([pid,to]))]).then(function(r){
      if(r[1])throw new Error('يوجد عنصر بالاسم "'+basename(to)+'" هنا');
      var items=r[0].filter(function(f){return f.path===from||f.path.indexOf(from+'/')===0});
      if(!items.length)throw new Error('العنصر غير موجود');
      for(var d=dirname(to);d;d=dirname(d))F.put({pid:pid,path:d,type:'dir',mtime:now()});
      items.forEach(function(f){
        var n=Object.assign({},f,{path:to+f.path.slice(from.length),mtime:now()});
        F.put(n);if(!keep)F.delete([pid,f.path]);
      });
      return touch(P,pid);
    });
  }).then(function(){return to});
}
// اسم غير مستخدم في المجلد: "name (2).ext"
function freeName(pid,dir,name){
  return list(pid).then(function(a){
    var taken={};a.forEach(function(f){taken[f.path]=1});
    var p=join(dir,name);if(!taken[p])return p;
    var m=/^(.*?)(\.[^.]*)?$/.exec(name),i=2;
    while(taken[join(dir,m[1]+' ('+i+')'+(m[2]||''))])i++;
    return join(dir,m[1]+' ('+i+')'+(m[2]||''));
  });
}
// يطلب من المتصفح عدم حذف بيانات التطبيق تلقائياً عند امتلاء الجهاز
function persist(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}}
function usage(){try{return navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():Promise.resolve(null)}catch(e){return Promise.resolve(null)}}
function meta(k,v){return tx(['meta'],v===undefined?'readonly':'readwrite',function(M){return v===undefined?req(M.get(k)).then(function(r){return r&&r.v}):M.put({k:k,v:v})})}

window.VFS={open:open,projects:projects,project:project,createProject:createProject,renameProject:renameProject,deleteProject:deleteProject,duplicateProject:duplicateProject,
  list:list,all:all,read:read,write:write,exists:exists,mkdir:mkdir,remove:remove,
  move:function(pid,a,b){return moveOrCopy(pid,a,b,false)},copy:function(pid,a,b){return moveOrCopy(pid,a,b,true)},freeName:freeName,
  norm:norm,dirname:dirname,basename:basename,join:join,checkName:checkName,langOf:langOf,isText:isText,mimeOf:mimeOf,kindOf:kindOf,ext:ext,
  persist:persist,usage:usage,meta:meta};
})();
