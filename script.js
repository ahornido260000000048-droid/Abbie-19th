/* ---------- images (Google Drive) ----------
   Files must be shared as "Anyone with the link". Or download them and use src="images/1.jpg". */
document.querySelectorAll('img[data-id]').forEach(img=>{
  img.src='https://drive.google.com/thumbnail?id='+img.dataset.id+'&sz=w800';
  img.onerror=()=>{img.onerror=null;img.src='https://lh3.googleusercontent.com/d/'+img.dataset.id+'=w800'};
});
const $=id=>document.getElementById(id);

/* ---------- knobs spin ---------- */
document.querySelectorAll('[data-k]').forEach(k=>{let a=0;k.onclick=()=>{a+=70;k.style.transform=`rotate(${a}deg)`}});

/* ---------- oven drag (pull the door DOWN) ---------- */
const door=$('door'),oven=$('oven'),hint=$('dragHint'),inside=$('inside');
let startY=0,angle=0,drag=false,isOpen=false;
const MAX=85;
const setAngle=a=>{angle=Math.max(0,Math.min(MAX,a));door.style.transform=`rotateX(${-angle}deg)`};
door.addEventListener('pointerdown',e=>{drag=true;startY=e.clientY;door.classList.add('dragging');door.setPointerCapture(e.pointerId)});
door.addEventListener('pointermove',e=>{if(!drag)return;setAngle((e.clientY-startY)/oven.offsetHeight*MAX*2.2)});
function finish(){
  if(!drag)return;drag=false;door.classList.remove('dragging');
  isOpen=angle>MAX*.35;setAngle(isOpen?MAX:0);hint.classList.toggle('gone',isOpen);
  if(isOpen)setTimeout(openInside,650);
}
door.addEventListener('pointerup',finish);door.addEventListener('pointercancel',finish);
door.addEventListener('dblclick',()=>{drag=true;angle=MAX;finish()});
function openInside(){inside.classList.add('show');$('layers').scrollTop=0;updDots()}
$('closeOven').onclick=()=>{inside.classList.remove('show');isOpen=false;setAngle(0);hint.classList.remove('gone')};

/* layer dots */
const layers=$('layers'),dots=[...$('dots').children];
function updDots(){const i=Math.round(layers.scrollTop/layers.clientHeight);dots.forEach((d,j)=>d.classList.toggle('on',i===j))}
layers.addEventListener('scroll',updDots);
dots.forEach((d,i)=>d.onclick=()=>layers.scrollTo({top:i*layers.clientHeight,behavior:'smooth'}));

/* ---------- menu ---------- */
const MENU={
 'Budget Meals':[['Pork Signature Sisig',88],['Chicken Skin',88],['Grilled BBQ Pork Chop',88],['pcs Chicken Wings',108],['Chicharon Bulaklak',108]],
 'Special Menu':[['Grilled Pork Belly Liempo',168],['Sizzling Signature Platter',168],['Sizzling Crispy Sisig + Bagnet',234],['Sizzling Whole Bangus w/ Sauce',168],['Deep Fried Whole Bangus',168]],
 'Combo Meals':[['A. Pork Sisig w/ Chicken',188],['B. Pork Sisig w/ Chicharon Bulaklak',188],['C. Pork Sisig w/ Chicken Skin',168],['D. Pork Sisig w/ Grilled Pork Chop',168]],
 'Appetizer':[['Beef Mami Overload',60],['Palabok Overload',70]],
 'Desserts':[['Fluffy Mango Float',120],['Giant Special Tapioca',100]],
 'Drinks':[['Small Coke',15],['Mineral Water',15]]
};
$('menu').innerHTML=Object.entries(MENU).map(([k,v])=>`<div class="mcard"><h4>${k}</h4>${v.map(([n,p])=>`<p><span>${n}</span><b>₱${p}</b></p>`).join('')}</div>`).join('');

/* ---------- creative popup ---------- */
let tT;
function popup(title,sub,ms,emojis){
  $('ttl').textContent=title;$('msg').textContent=sub||'';
  const c=$('conf');c.innerHTML='';
  for(let i=0;i<22;i++){const b=document.createElement('b');b.textContent=emojis[i%emojis.length];
    const a=Math.random()*6.28,d=120+Math.random()*140;
    b.style.setProperty('--x',Math.cos(a)*d+'px');b.style.setProperty('--y',Math.sin(a)*d+'px');b.style.setProperty('--r',Math.random()*360+'deg');c.appendChild(b)}
  $('toast').classList.add('show');clearTimeout(tT);tT=setTimeout(()=>$('toast').classList.remove('show'),ms);
}
$('riceBtn').onclick=()=>popup('YOU CAN HAVE UNLIMITED RICE','🍚 refill as much as you like! 🍚',3000,['🍚','🌾','✨','🍽️']);

const open=id=>$(id).classList.add('show');let raf;
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{b.closest('.modal').classList.remove('show');cancelAnimationFrame(raf)});
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('pointerdown',e=>{if(e.target===m){m.classList.remove('show');cancelAnimationFrame(raf)}}));

/* ---------- animated route map ----------
   EDIT: replace street names with the real ones. Coordinates are on a 400x300 canvas. */
const STREETS=[
 {name:'Church Road',pts:[[40,250],[200,250]],lx:70,ly:268},
 {name:'Rizal Street',pts:[[200,250],[200,140]],lx:206,ly:205},
 {name:'Bonifacio Avenue',pts:[[200,140],[340,140]],lx:225,ly:132},
 {name:'Quezon Street',pts:[[340,140],[340,50]],lx:346,ly:100}
];
const OTHER=[[[30,150],[200,150]],[[100,30],[100,290]],[[270,20],[270,290]],[[30,60],[390,60]],[[30,200],[390,200]]];
const NS='http://www.w3.org/2000/svg';
function drawMap(){
  const svg=$('map');svg.innerHTML='';
  const line=(pts,cls)=>{const p=document.createElementNS(NS,'path');p.setAttribute('d','M'+pts.map(q=>q.join(',')).join(' L'));p.setAttribute('class',cls);svg.appendChild(p);return p};
  OTHER.forEach(o=>line(o,'roadedge'));STREETS.forEach(s=>line(s.pts,'roadedge'));
  OTHER.forEach(o=>line(o,'road'));STREETS.forEach(s=>line(s.pts,'road'));
  STREETS.forEach(s=>{const t=document.createElementNS(NS,'text');t.setAttribute('x',s.lx);t.setAttribute('y',s.ly);t.setAttribute('class','rlabel');t.textContent=s.name;svg.appendChild(t)});
  const all=[];STREETS.forEach((s,i)=>s.pts.forEach((p,j)=>{if(!(i&&j===0))all.push(p)}));
  const route=line(all,'');route.id='route';
  const L=route.getTotalLength();route.style.strokeDasharray=L;route.style.strokeDashoffset=L;
  const pin=(x,y,txt,c)=>{const g=document.createElementNS(NS,'g');g.innerHTML=`<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#fff" stroke-width="3"/><text x="${x}" y="${y-14}" text-anchor="middle" font-size="12" font-weight="bold" fill="#2b3b55">${txt}</text>`;svg.appendChild(g)};
  pin(all[0][0],all[0][1],'⛪ CHURCH','#34598c');pin(all.at(-1)[0],all.at(-1)[1],"🍽️ THIRDY'S",'#e5484d');
  const w=document.createElementNS(NS,'text');w.setAttribute('font-size','18');w.textContent='🚶';svg.appendChild(w);
  const t0=performance.now(),D=5000;
  (function step(t){
    const k=Math.min(1,(t-t0)/D),pt=route.getPointAtLength(L*k);
    route.style.strokeDashoffset=L*(1-k);w.setAttribute('x',pt.x-9);w.setAttribute('y',pt.y+6);
    const i=Math.min(STREETS.length-1,Math.floor(k*STREETS.length));
    $('steps').textContent=k<1?`Walk along ${STREETS[i].name}…`:"You made it to Thirdy's! 🎉";
    if(k<1)raf=requestAnimationFrame(step);
  })(t0);
}
$('mapBtn').onclick=()=>{open('mapModal');cancelAnimationFrame(raf);drawMap()};
$('replay').onclick=()=>{cancelAnimationFrame(raf);drawMap()};

/* ---------- calculator ---------- */
const COLORS=['#e5484d','#f59e0b','#22a06b','#3b82f6','#8b5cf6','#ec4899'];
let expr='',justEq=false;
['C','⌫','÷','×','7','8','9','−','4','5','6','+','1','2','3','=','0','.'].forEach((k,i)=>{
  const b=document.createElement('button');b.textContent=k;
  b.style.background=/[0-9.]/.test(k)?COLORS[i%COLORS.length]:'#34598c';
  if(k==='=')b.style.background='#e5484d';
  if(k==='0')b.style.gridColumn='span 2';
  b.onclick=()=>press(k);$('keys').appendChild(b);
});
const show=t=>$('expr').innerHTML=t||'&nbsp;';
function press(k){
  if(k==='C'){expr='';$('out').textContent='0';show('');return}
  if(k==='⌫'){expr=expr.slice(0,-1).trimEnd();show(expr);$('out').textContent=expr.split(' ').pop()||'0';return}
  if(k==='='){
    if(!expr)return;
    let r;try{r=Function('"use strict";return ('+expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')+')')()}catch{r=NaN}
    if(!isFinite(r)){$('out').textContent='Error';expr='';return}
    r=Math.round(r*1e8)/1e8;show(expr+' = '+r);$('out').textContent=r;expr=String(r);justEq=true;
    if(r===19)popup('KKB PO TAYO!','🎂 Abbie is 19! 🎂',5000,['🎉','🎂','🎈','💙','✨']);
    return;
  }
  const isOp='÷×−+'.includes(k);
  if(justEq&&!isOp)expr='';
  justEq=false;expr+=isOp?` ${k} `:k;show(expr);$('out').textContent=isOp?k:expr.split(' ').pop();
}
$('pushBtn').onclick=()=>{expr='';show('');$('out').textContent='0';$('hintText').textContent='(tap me)';open('calcModal')};
$('hintNote').onclick=()=>{$('hintText').textContent='Was a debutant last year'};
