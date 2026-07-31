(function(){
  var views=document.querySelectorAll('section[data-view]');
  var navs=document.querySelectorAll('[data-nav]');
  function show(){
    var h=(location.hash||'#room').slice(1).split('/')[0];
    var hit=false;
    views.forEach(function(v){var on=v.getAttribute('data-view')===h;v.classList.toggle('on',on);if(on)hit=true;});
    if(!hit){views.forEach(function(v){v.classList.toggle('on',v.getAttribute('data-view')==='room');});h='room';}
    var nk=h.indexOf('room')===0?'room':h;
    navs.forEach(function(a){a.classList.toggle('here',a.getAttribute('data-nav')===nk);});
    window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',show); show();

  function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.style.display='block';
    clearTimeout(t._h);t._h=setTimeout(function(){t.style.display='none'},2600);}

  var play=document.getElementById('playbtn'),fill=document.getElementById('pfill'),playing=false,w=0,tick;
  if(play){play.addEventListener('click',function(){
    playing=!playing;play.textContent=playing?'▮▮':'▶';
    if(playing){tick=setInterval(function(){w=(w+3)%100;fill.style.width=w+'%';},400);
      toast('(this would play. one song per room, rights-clear. autoplay is an argument you get to have.)');}
    else clearInterval(tick);
  });}

  var st=document.getElementById('staplebtn');
  if(st){st.addEventListener('click',function(){
    st.classList.add('done');st.textContent='⌷ stapled';
    toast("stapled to NIGHT BUS's corkboard. that's the only kind of viral this system has.");
  });}

  document.querySelectorAll('.subbtn').forEach(function(b){
    b.addEventListener('click',function(){
      var row=b.closest('.sub');row.classList.toggle('cut');
      var cut=row.classList.contains('cut');
      b.textContent=cut?'RESTORE':'CUT';
      toast(cut?'cut. it goes back to the maker; it can run next cycle.':'restored to the tray.');
    });
  });

  var bb=document.getElementById('buildbtn');
  if(bb){bb.addEventListener('click',function(){
    document.getElementById('built').classList.add('on');
    bb.disabled=true;bb.textContent='BUILT';
    toast('assembled. no push notification fired; friday the bell rings once.');
  });}

  var fb=document.getElementById('foundbtn');
  if(fb){fb.addEventListener('click',function(){
    fb.classList.add('done');fb.textContent='FOUNDED (demo)';
    toast('scene founded. first issue within one cycle; the gate is issue #2.');
  });}
})();
