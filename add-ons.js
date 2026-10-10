/* addons.js — 책 넘김(PAGE-BOOK) + 공개 글만 실시간 연동(READER-SHARE)
   글쓰기(index.html)와 리더(reader.html) 양쪽에서 </body> 직전에 로드된다. */
(function(){
  var css=''+
  /* 책 넘김 */
  '#r-book.on{color:var(--navy);background:var(--surface-2);}'+
  '#reader.pb-on .ov-body{position:relative;overflow:hidden;padding:0;}'+
  '#reader.pb-on .pb-view{position:absolute;left:20px;right:20px;top:14px;bottom:34px;overflow:hidden;touch-action:pan-y pinch-zoom;}'+
  '#reader.pb-on .pb-sheet{position:absolute;inset:0;overflow:hidden;background:var(--paper);z-index:1;}'+
  '#reader.pb-on .pb-sheet.pb-top{z-index:2;will-change:clip-path;}'+
  '#reader.pb-on .pb-flow{height:100%;column-fill:auto;}'+
  '#reader.pb-on .cover,#reader.pb-on .reaction-bar,#reader.pb-on .comment-input-wrap,#reader.pb-on .comment-item,'+
  '#reader.pb-on .r-body img,#reader.pb-on .r-body pre,#reader.pb-on .r-body table,#reader.pb-on .r-body blockquote,'+
  '#reader.pb-on .r-body li,#reader.pb-on .yt-embed,#reader.pb-on .web-head,#reader.pb-on .web-actions,'+
  '#reader.pb-on .web-body img,#reader.pb-on .web-body figure{break-inside:avoid;}'+
  '#reader.pb-on #r-title,#reader.pb-on .comments-head,#reader.pb-on .r-body h1,#reader.pb-on .r-body h2,'+
  '#reader.pb-on .r-body h3,#reader.pb-on .r-body h4,#reader.pb-on .web-body h2,#reader.pb-on .web-body h3{break-after:avoid;}'+
  '#reader.pb-on .r-body img,#reader.pb-on .web-body img{max-height:calc(var(--pbh,600px) - 40px);object-fit:contain;}'+
  '#reader.pb-on .cover .embed-scroll,#reader.pb-on .cover .embed-scroll.tall{height:calc(var(--pbh,600px) - 90px);min-height:0;}'+
  '#reader.pb-on .web-body iframe.web-raw{height:calc(var(--pbh,600px) - 120px);}'+
  '#reader.pb-on .code-pre{max-height:calc(var(--pbh,600px) - 120px);}'+
  '#reader.pb-on .web-body{max-height:none;overflow:visible;}'+
  '#reader.pb-on .web-fade,#reader.pb-on .web-more{display:none!important;}'+
  '.pb-folio{display:none;}'+
  '#reader.pb-on .pb-folio{display:block;position:absolute;left:0;right:0;bottom:11px;text-align:center;pointer-events:none;'+
  'font-family:var(--data);font-size:10.5px;letter-spacing:.08em;color:var(--meta);font-variant-numeric:tabular-nums;}'+
  '.pb-curl{position:absolute;top:0;left:-100%;width:200%;height:100%;z-index:3;pointer-events:none;display:none;overflow:visible;}'+
  '.pb-curl.on{display:block;}'+
  '.pb-curl .s-f0{stop-color:var(--dk4,#E4EDF7);}.pb-curl .s-f1{stop-color:var(--surface,#fff);}.pb-curl .s-f2{stop-color:var(--dk2,#F8FAFD);}'+
  '.pb-curl .s-s0{stop-color:#0E1E37;stop-opacity:.3;}.pb-curl .s-s1{stop-color:#0E1E37;stop-opacity:0;}'+
  '.pb-curl .edge{fill:none;stroke:var(--hair-2);stroke-width:1;}'+
  /* 공개 연동 */
  'body.is-reader #r-edit,body.is-reader #r-del,body.viewer #r-edit,body.viewer #r-del{display:none!important;}'+
  '.switch.share input:checked ~ .track{background:#1A8040;}'+
  '#r-share-toggle.on{color:#1A8040;background:rgba(26,128,64,.1);}'+
  '.share-badge{display:inline-flex;align-items:center;background:rgba(26,128,64,.1);color:#1A8040;'+
  'font-family:var(--sans);font-size:9.5px;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;}';
  var st=document.createElement('style'); st.id='addons-css'; st.textContent=css; document.head.appendChild(st);
})();

/* ═══════════ PAGE-BOOK : 리포트를 한 장씩 넘겨 읽기 ═══════════ */
(function(){
  'use strict';
  var reader=document.getElementById('reader'); if(!reader) return;
  var body=reader.querySelector('.ov-body'), bar=reader.querySelector('.ov-bar');
  if(!body||!bar) return;
  var KEY='pb_book_mode_v1', HINT='pb_hint_v1';
  var on=true; try{ if(appStorage.getItem(KEY)==='0') on=false; }catch(e){}
  var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  var view=document.createElement('div'); view.className='pb-view';
  var sheet=document.createElement('div'); sheet.className='pb-sheet';
  var flow=document.createElement('div'); flow.className='pb-flow';
  while(body.firstChild) flow.appendChild(body.firstChild);
  sheet.appendChild(flow); view.appendChild(sheet); body.appendChild(view);
  var folio=document.createElement('div'); folio.className='pb-folio'; folio.setAttribute('aria-live','polite');
  body.appendChild(folio);

  var btn=document.createElement('button'); btn.className='iconbtn'; btn.id='r-book'; btn.type='button';
  btn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H10a2 2 0 0 1 2 2v15a1.5 1.5 0 0 0-1.5-1.5H2z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H14a2 2 0 0 0-2 2v15a1.5 1.5 0 0 1 1.5-1.5H22z"/></svg>';
  bar.insertBefore(btn, document.getElementById('r-translate')||null);

  var NS='http://www.w3.org/2000/svg', ov=document.createElementNS(NS,'svg');
  ov.setAttribute('class','pb-curl'); ov.setAttribute('aria-hidden','true');
  ov.innerHTML='<defs><linearGradient id="pbFlapG" gradientUnits="userSpaceOnUse"><stop offset="0" class="s-f0"/><stop offset=".22" class="s-f1"/><stop offset="1" class="s-f2"/></linearGradient>'+
    '<linearGradient id="pbShadeG" gradientUnits="userSpaceOnUse"><stop offset="0" class="s-s0"/><stop offset="1" class="s-s1"/></linearGradient>'+
    '<filter id="pbDrop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#0E1E37" flood-opacity=".24"/></filter></defs>'+
    '<polygon class="shade" fill="url(#pbShadeG)"/><g filter="url(#pbDrop)"><polygon class="flap" fill="url(#pbFlapG)"/></g><polyline class="edge"/>';
  view.appendChild(ov);
  var shadeEl=ov.querySelector('.shade'), flapEl=ov.querySelector('.flap'), edgeEl=ov.querySelector('.edge');
  var gF=ov.querySelector('#pbFlapG'), gS=ov.querySelector('#pbShadeG');

  var cur=0, n=1, W=0, H=0, G=48, busy=false, lastId=null, topEl=null;

  function count(){
    var fr=flow.getBoundingClientRect(), max=0;
    Array.prototype.forEach.call(flow.children,function(c){
      Array.prototype.forEach.call(c.getClientRects(),function(r){ if(r.width||r.height) max=Math.max(max,r.right-fr.left); });
    });
    return Math.max(1,Math.ceil((max-1)/(W+G)));
  }
  function updateBar(){
    var pb=document.querySelector('.sw-progress');
    if(pb&&on&&reader.classList.contains('open')) pb.style.width=(n>1?(cur+1)/n*100:100)+'%';
  }
  function place(){
    flow.style.transform='translateX('+(-cur*(W+G))+'px)';
    folio.textContent=n>1?(cur+1)+' / '+n:'';
    updateBar();
  }
  function layout(){
    if(!on) return;
    W=view.clientWidth; H=view.clientHeight; if(!W||!H) return;
    flow.style.width=W+'px'; flow.style.columnWidth=W+'px'; flow.style.columnGap=G+'px';
    reader.style.setProperty('--pbh',H+'px');
    n=count(); if(cur>n-1) cur=n-1; if(cur<0) cur=0;
    place();
  }
  var sT=0;
  function schedule(){ if(!on) return; clearTimeout(sT); sT=setTimeout(function(){ if(busy) schedule(); else layout(); },120); }

  function geom(P){
    var dx=W-P.x, dy=H-P.y, len=Math.sqrt(dx*dx+dy*dy); if(len<.5) return null;
    var nn={x:dx/len,y:dy/len}, M={x:(W+P.x)/2,y:(H+P.y)/2};
    function f(p){ return (p.x-M.x)*nn.x+(p.y-M.y)*nn.y; }
    var rect=[{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}];
    function clip(poly,sg){ var out=[];
      for(var i=0;i<poly.length;i++){ var A=poly[i],B=poly[(i+1)%poly.length],fa=sg*f(A),fb=sg*f(B);
        if(fa>=0) out.push(A);
        if((fa>=0)!==(fb>=0)){ var t=fa/(fa-fb); out.push({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t}); } }
      return out; }
    var front=clip(rect,-1), lifted=clip(rect,1), depth=1;
    var flap=lifted.map(function(p){ var d=f(p); if(d>depth) depth=d; return {x:p.x-2*d*nn.x,y:p.y-2*d*nn.y}; });
    return {n:nn,M:M,front:front,lifted:lifted,flap:flap,depth:depth};
  }
  function pts(a){ return a.map(function(p){ return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' '); }
  function draw(P){
    var g=geom(P);
    if(!g){ topEl.style.clipPath=''; topEl.style.webkitClipPath='';
      shadeEl.setAttribute('points',''); flapEl.setAttribute('points',''); edgeEl.setAttribute('points',''); return; }
    var cp=g.front.length>2?'polygon('+g.front.map(function(p){ return p.x.toFixed(1)+'px '+p.y.toFixed(1)+'px'; }).join(',')+')':'polygon(0 0,0 0,0 0)';
    topEl.style.clipPath=cp; topEl.style.webkitClipPath=cp;
    shadeEl.setAttribute('points',pts(g.lifted)); flapEl.setAttribute('points',pts(g.flap));
    var s=Math.min(160,W*.32), reach=Math.max(Math.min(g.depth,34+W*.12),g.depth);
    gS.setAttribute('x1',g.M.x); gS.setAttribute('y1',g.M.y); gS.setAttribute('x2',g.M.x+g.n.x*s); gS.setAttribute('y2',g.M.y+g.n.y*s);
    gF.setAttribute('x1',g.M.x); gF.setAttribute('y1',g.M.y); gF.setAttribute('x2',g.M.x-g.n.x*reach); gF.setAttribute('y2',g.M.y-g.n.y*reach);
    edgeEl.setAttribute('points',g.flap.length>1?pts(g.flap):'');
  }
  function pathAt(t){ return {x:W-2*W*t, y:H-H*.17*Math.sin(Math.PI*t)}; }
  function ease(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }

  function makeClone(page){
    var c=sheet.cloneNode(true);
    c.classList.remove('pb-top'); c.style.clipPath=''; c.style.webkitClipPath='';
    Array.prototype.forEach.call(c.querySelectorAll('[id]'),function(x){ x.removeAttribute('id'); });
    Array.prototype.forEach.call(c.querySelectorAll('iframe'),function(x){ x.removeAttribute('src'); x.removeAttribute('srcdoc'); });
    Array.prototype.forEach.call(c.querySelectorAll('video,audio'),function(x){ x.removeAttribute('src'); x.removeAttribute('autoplay'); });
    Array.prototype.forEach.call(c.querySelectorAll('[contenteditable]'),function(x){ x.removeAttribute('contenteditable'); });
    c.setAttribute('inert',''); c.setAttribute('aria-hidden','true');
    c.querySelector('.pb-flow').style.transform='translateX('+(-page*(W+G))+'px)';
    return c;
  }
  function jumpTo(p){ cur=Math.max(0,Math.min(n-1,p)); place(); }
  function goTo(t){
    if(busy||!on||t<0||t>=n||t===cur) return;
    if(reduced){ jumpTo(t); return; }
    busy=true;
    var fwd=t>cur, clone=makeClone(t);
    view.insertBefore(clone,ov);
    var top=fwd?sheet:clone; top.classList.add('pb-top'); topEl=top;
    ov.setAttribute('viewBox',(-W)+' 0 '+(2*W)+' '+H); ov.classList.add('on');
    var dur=W<600?780:980, t0=null;
    draw(pathAt(fwd?0:1));
    function step(ts){
      if(t0===null) t0=ts;
      var k=Math.min(1,(ts-t0)/dur), e=ease(k);
      draw(pathAt(fwd?e:1-e));
      if(k<1){ requestAnimationFrame(step); return; }
      sheet.style.clipPath=''; sheet.style.webkitClipPath=''; sheet.classList.remove('pb-top');
      cur=t; place(); clone.remove(); ov.classList.remove('on'); topEl=null; busy=false;
    }
    requestAnimationFrame(step);
  }
  function next(){ goTo(cur+1); }
  function prev(){ goTo(cur-1); }

  function applyMode(){
    reader.classList.toggle('pb-on',on);
    btn.classList.toggle('on',on); btn.setAttribute('aria-pressed',String(on));
    var lbl=on?'스크롤로 읽기':'한 장씩 넘겨 읽기'; btn.setAttribute('aria-label',lbl); btn.title=lbl;
    if(on){ cur=0; requestAnimationFrame(layout); }
    else { flow.style.cssText=''; folio.textContent=''; reader.style.removeProperty('--pbh'); body.scrollTop=0; }
  }
  btn.addEventListener('click',function(){
    if(busy) return;
    on=!on; try{ appStorage.setItem(KEY,on?'1':'0'); }catch(e){}
    applyMode();
  });
  function hintOnce(){
    var seen=false; try{ seen=!!appStorage.getItem(HINT); }catch(e){}
    if(seen||n<2||typeof window.showSnack!=='function') return;
    try{ appStorage.setItem(HINT,'1'); }catch(e){}
    showSnack('좌우를 탭하거나 밀어서 넘겨요 · 위 책 아이콘으로 스크롤 전환',null,null,4600);
  }
  var prevHook=window.__onReaderOpen;
  window.__onReaderOpen=function(a){
    if(typeof prevHook==='function'){ try{ prevHook(a); }catch(e){} }
    var id=a&&a.id; if(id!==lastId){ cur=0; lastId=id; }
    if(on) requestAnimationFrame(function(){ layout(); hintOnce(); });
  };
  reader.addEventListener('transitionend',function(e){ if(e.target===reader) updateBar(); });

  if('ResizeObserver' in window) new ResizeObserver(schedule).observe(view);
  new MutationObserver(schedule).observe(flow,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});
  flow.addEventListener('load',schedule,true);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(schedule);

  [body,view,sheet].forEach(function(el){
    el.addEventListener('scroll',function(){ if(on&&(el.scrollTop||el.scrollLeft)){ el.scrollTop=0; el.scrollLeft=0; } },{passive:true});
  });
  flow.addEventListener('focusin',function(e){
    if(!on||busy) return;
    var fr=flow.getBoundingClientRect(), r=e.target.getBoundingClientRect();
    var p=Math.floor((r.left-fr.left+1)/(W+G)); if(p!==cur) jumpTo(p);
  });

  var SKIP='a,button,input,textarea,select,label,iframe,video,audio,img,[contenteditable],.comment-field,.code-view,.web-actions,.social-wrap,.embed-bar,summary';
  view.addEventListener('click',function(e){
    if(!on||busy||e.target.closest(SKIP)) return;
    if(window.getSelection&&String(window.getSelection())) return;
    var r=view.getBoundingClientRect(), x=(e.clientX-r.left)/r.width;
    if(x<.3) prev(); else if(x>.7) next();
  });
  var sx=0,sy=0,stt=0,track=false;
  view.addEventListener('touchstart',function(e){
    if(!on||e.touches.length!==1){ track=false; return; }
    track=!e.target.closest('.code-pre,table,.embed-scroll,input,textarea,[contenteditable]');
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; stt=Date.now();
  },{passive:true});
  view.addEventListener('touchend',function(e){
    if(!track) return; track=false;
    var t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5&&Date.now()-stt<700){ if(dx<0) next(); else prev(); }
  },{passive:true});
  var wheelAt=0;
  view.addEventListener('wheel',function(e){
    if(!on||e.ctrlKey||e.target.closest('.embed-scroll,.code-pre')) return;
    e.preventDefault();
    var d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(Math.abs(d)<12) return;
    var now=Date.now(); if(now-wheelAt<450) return; wheelAt=now;
    if(d>0) next(); else prev();
  },{passive:false});
  document.addEventListener('keydown',function(e){
    if(!on||!reader.classList.contains('open')) return;
    if(document.querySelector('.lang-panel.open,.lightbox.open')) return;
    var t=e.target, tag=(t&&t.tagName)||'';
    if(tag==='INPUT'||tag==='TEXTAREA'||(t&&t.isContentEditable)||e.altKey||e.ctrlKey||e.metaKey) return;
    if(e.key==='ArrowRight'||e.key==='PageDown'){ e.preventDefault(); next(); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); prev(); }
  });

  applyMode();
})();

/* ═══════════ READER-SHARE : '리더에 실시간 공개' 글만 연동 ═══════════ */
(function(){
  'use strict';
  function shared(a){ return !!(a&&a.share===true); }
  var IS_READER=(typeof APP_ROLE!=='undefined'&&APP_ROLE==='reader')||(typeof VIEWER!=='undefined'&&VIEWER);

  /* ── 리더: 공개 글만 ── */
  if(IS_READER){
    var origRender=window.render;
    if(typeof origRender==='function'){
      window.render=function(){ try{ articles=articles.filter(shared); }catch(e){} return origRender.apply(this,arguments); };
    }
    var origApply=window.__applyExternalArticles;
    if(typeof origApply==='function'){
      window.__applyExternalArticles=function(list){ return origApply((list||[]).filter(shared)); };
    }
    try{ articles=articles.filter(shared); render(); }catch(e){}
    return;
  }

  /* ── 글쓰기 ── */
  var hasSync=!!(window.NewsSync&&NewsSync.enabled);
  function onServer(id){
    var p=window.NewsSync&&NewsSync.state&&NewsSync.state.posts;
    return !Array.isArray(p)||p.some(function(x){ return x&&x.id===id; });
  }

  // ① 작성 화면 토글 (새 글은 꺼진 상태로 시작)
  var grid=document.querySelector('#composer .toggle-grid'), input=null;
  if(grid){
    var lab=document.createElement('label'); lab.className='live-toggle';
    lab.innerHTML='<span class="switch share"><input type="checkbox" id="share-input" aria-label="리더에 실시간 공개">'+
      '<span class="track"></span><span class="knob"></span></span><span>리더에 실시간 공개</span>';
    grid.appendChild(lab); input=lab.querySelector('input');
  }
  var composer=document.getElementById('composer');
  if(composer&&input){
    new MutationObserver(function(){
      if(!composer.classList.contains('open')) return;
      var a=(editingId!==null)?articles.find(function(x){ return x.id===editingId; }):null;
      input.checked=a?shared(a):false;
    }).observe(composer,{attributes:true,attributeFilter:['class']});
  }

  // ② 게시/저장 순간 표식 달기
  var pending=null, pub=document.getElementById('publish');
  if(pub&&input) pub.addEventListener('click',function(){
    pending=input.checked; setTimeout(function(){ pending=null; },0);
  },true);
  var origPut=NewsStore.putArticle;
  NewsStore.putArticle=function(a){
    if(pending!==null&&a){ a.share=pending; pending=null; }
    return origPut.apply(this,arguments);
  };

  // ③ 서버엔 공개 글만, 공개 해제 시 내림
  var origRemove=null;
  if(hasSync){
    var origPush=NewsSync.push, origReplace=NewsSync.replaceAll;
    origRemove=NewsSync.remove;
    NewsSync.push=function(a){
      if(shared(a)) return origPush.apply(this,arguments);
      if(a&&a.id&&origRemove&&onServer(a.id)) return origRemove.call(this,a.id);
    };
    if(origReplace) NewsSync.replaceAll=function(list){ return origReplace.call(this,(list||[]).filter(shared)); };
  }

  // ④ 파일 발행본에도 공개 글만
  var origBake=window.bakeAndDownload;
  if(typeof origBake==='function'){
    window.bakeAndDownload=async function(){
      var g=NewsStore.getAllArticles;
      NewsStore.getAllArticles=function(){ return g.apply(NewsStore,arguments).then(function(l){ return (l||[]).filter(shared); }); };
      try{ return await origBake.apply(this,arguments); } finally{ NewsStore.getAllArticles=g; }
    };
  }

  // ⑤ 목록 카드에 '리더 공개' 표시
  var origCard=window.buildCard;
  if(typeof origCard==='function'){
    window.buildCard=function(a,f){
      var el=origCard(a,f);
      if(shared(a)){ var s=el.querySelector('.src'); if(s) s.insertAdjacentHTML('afterbegin','<span class="share-badge">리더 공개</span>&nbsp;'); }
      return el;
    };
  }

  // ⑥ 읽기 화면에서 바로 공개/내리기
  var bar=document.querySelector('#reader .ov-bar'), tbtn=null;
  if(bar){
    tbtn=document.createElement('button'); tbtn.className='iconbtn'; tbtn.id='r-share-toggle'; tbtn.type='button';
    tbtn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/></svg>';
    bar.insertBefore(tbtn,document.getElementById('r-edit')||null);
  }
  function paint(){
    if(!tbtn||!curRead) return;
    var on=shared(curRead), lbl=on?'리더 공개 중 — 눌러서 내리기':'리더에 공개하기';
    tbtn.classList.toggle('on',on); tbtn.setAttribute('aria-pressed',String(on));
    tbtn.setAttribute('aria-label',lbl); tbtn.title=lbl;
  }
  var prevHook=window.__onReaderOpen;
  window.__onReaderOpen=function(a){ if(typeof prevHook==='function'){ try{ prevHook(a); }catch(e){} } paint(); };
  if(tbtn) tbtn.addEventListener('click',async function(){
    if(!curRead) return;
    curRead.share=!shared(curRead); paint();
    var ok=await persist(curRead); render();
    showSnack(ok?(curRead.share?'리더에 공개했어요 — 곧 반영돼요':'리더에서 내렸어요'):'저장하지 못했어요',null);
  });

  // ⑦ 공개 표시 없는 예전 글이 서버에 남아 있으면 한 번 정리 제안
  setTimeout(function(){
    if(!hasSync||!origRemove||!NewsSync.isAdmin||!NewsSync.isAdmin()) return;
    var posts=(NewsSync.state&&NewsSync.state.posts)||[], local={};
    articles.forEach(function(a){ local[a.id]=a; });
    var stray=posts.filter(function(p){ var l=local[p.id]; return p&&p.id&&!(l?shared(l):shared(p)); });
    if(!stray.length) return;
    showSnack('공개 표시 없는 글 '+stray.length+'개가 서버에 남아 있어요','내리기',function(){
      stray.forEach(function(p){ try{ origRemove.call(NewsSync,p.id); }catch(e){} });
      showSnack('리더에서 내렸어요',null);
    },10000);
  },4000);

  try{ render(); }catch(e){}
})();
