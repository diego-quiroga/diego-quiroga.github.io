const media=matchMedia('(prefers-reduced-motion: reduce)');
const menu=document.querySelector('.menu-button'),nav=document.getElementById('navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.querySelector('span').textContent='+';}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.querySelector('span').textContent=open?'−':'+';});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});

const study=document.getElementById('computer-study'),explode=document.getElementById('explode'),tour=document.getElementById('component-tour'),stage=document.querySelector('.art-stage');
const components={
  z80:['Z80 / The processor','Executes instructions. BASIC lives in ROM, but the Z80 runs it and does the arithmetic for your program.'],
  ula:['ULA / The custom logic','Turns screen memory into a TV picture, scans the keyboard, and handles tape and sound signals.'],
  ram:['RAM / The working space','Eight memory chips provide 16 KB for your program, variables, and screen. Switch the power off and it is gone.'],
  rom:['ROM / The built-in software','A separate 16 KB holds the BASIC interpreter and system routines. Switch on and you can start programming.']
};
let selected='z80',boardPromise;
function highlightPart(){stage.querySelectorAll('[data-part]').forEach(g=>g.classList.toggle('selected',g.dataset.part===selected));}
function selectPart(key){
  selected=key;const [title,description]=components[key];
  document.querySelectorAll('[data-component]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.component===key)));
  highlightPart();const detail=document.getElementById('component-detail');detail.replaceChildren();
  const strong=document.createElement('strong');strong.textContent=title+'. ';detail.append(strong,document.createTextNode(description));
}
function loadBoard(){
  if(boardPromise)return boardPromise;
  boardPromise=fetch(stage.dataset.computerSrc).then(r=>{if(!r.ok)throw Error('Drawing unavailable');return r.text();}).then(text=>{
    const svg=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;
    if(svg.localName!=='svg')throw Error('Invalid drawing');
    stage.replaceChildren(document.importNode(svg,true));highlightPart();
  }).catch(()=>{boardPromise=null;});
  return boardPromise;
}
explode.addEventListener('click',()=>{
  const open=tour.hidden;tour.hidden=!open;study.classList.toggle('exploded',open);explode.setAttribute('aria-expanded',String(open));
  explode.innerHTML=open?'Bring it back <span aria-hidden="true">↙</span>':'Take it apart <span aria-hidden="true">↗</span>';
  if(open)loadBoard();
});
document.querySelectorAll('[data-component]').forEach(b=>b.addEventListener('click',()=>selectPart(b.dataset.component)));
stage.addEventListener('click',e=>{const part=e.target.closest('[data-part]');if(part&&!tour.hidden)selectPart(part.dataset.part);});
selectPart('z80');
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loadBoard();observer.disconnect();}},{rootMargin:'200px'});observer.observe(study);}else loadBoard();

let basicPromise;
document.querySelectorAll('[data-open-lab]').forEach(button=>button.addEventListener('click',async()=>{
  const status=document.getElementById('lab-load-status');button.disabled=true;
  try{
    if(!basicPromise){status.textContent='Opening the program…';basicPromise=import('./basic.915c6aad1729.js').then(module=>module.initBasic(media));}
    const basic=await basicPromise;status.textContent='';basic.open(button);
  }catch(error){basicPromise=null;status.textContent='The program could not load. Please try again.';}
  finally{button.disabled=false;}
}));
