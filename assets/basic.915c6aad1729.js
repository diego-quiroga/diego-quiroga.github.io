export function initBasic(media){
const lab=document.getElementById('spectrum-lab'),runButton=document.getElementById('run-basic'),spacing=document.getElementById('line-spacing');
const canvas=document.getElementById('spectrum-screen'),ctx=canvas.getContext('2d'),listing=document.getElementById('basic-code');
const status=document.getElementById('basic-status'),machine=document.getElementById('machine-state'),explanation=document.getElementById('program-explainer');
let opener,program,pc=0,vars={},loops={},plotX=0,plotY=0,timer=null,mode='ready',lineCount=0;
const explanations=['CLS clears the screen.','FOR starts a loop. The spacing determines how many lines it draws.','PLOT moves the starting point up the left edge.','DRAW adds a straight line. Together, the lines suggest a curve.','NEXT increases n and repeats the loop until n is greater than 160.'];
function buildProgram(){
  const source=['10 CLS',`20 FOR n=0 TO 160 STEP ${spacing.value}`,'30 PLOT 48,8+n','40 DRAW n,160-n','50 NEXT n'];
  program=source.map(s=>{const m=s.match(/^(\d+) (\w+)\s*(.*)$/);return{number:Number(m[1]),op:m[2],args:m[3]};});
  listing.replaceChildren();program.forEach(p=>{const line=document.createElement('span');line.className='basic-line';const number=document.createElement('span');number.className='line-number';number.textContent=p.number;const keyword=document.createElement('span');keyword.className='basic-keyword';keyword.textContent=p.op;line.append(number,keyword,document.createTextNode(p.args?' '+p.args:''));listing.append(line);});
}
// A small arithmetic parser, used by the visible BASIC listing. No eval.
function expression(source){
  const tokens=source.match(/\d+(?:\.\d+)?|[a-z]+|[()+*\/-]/gi)||[];let i=0;
  function atom(){const t=tokens[i++];if(t==='-')return-atom();if(t==='+')return atom();if(t==='('){const value=sum();if(tokens[i++]!==')')throw Error('Missing bracket');return value;}if(/^\d/.test(t||''))return Number(t);if(Object.hasOwn(vars,t))return vars[t];throw Error('Unknown value');}
  function product(){let v=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=atom();v=op==='*'?v*b:v/b;}return v;}
  function sum(){let v=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();v=op==='+'?v+b:v-b;}return v;}
  const value=sum();if(i!==tokens.length||!Number.isFinite(value))throw Error('Invalid expression');return value;
}
function clearScreen(){ctx.fillStyle='#cdcdcd';ctx.fillRect(0,0,256,192);plotX=plotY=0;}
function pixel(x,y){if(x<0||x>255||y<0||y>175)throw Error('Point outside screen');ctx.fillStyle='#121512';ctx.fillRect(x,175-y,1,1);}
function draw(dx,dy){
  const endX=plotX+Math.round(dx),endY=plotY+Math.round(dy);let x=plotX,y=plotY;
  const ax=Math.abs(endX-x),ay=Math.abs(endY-y),sx=x<endX?1:-1,sy=y<endY?1:-1;let error=ax-ay;
  for(;;){pixel(x,y);if(x===endX&&y===endY)break;const twice=2*error;if(twice>-ay){error-=ay;x+=sx;}if(twice<ax){error+=ax;y+=sy;}}
  plotX=endX;plotY=endY;lineCount++;
}
function cancel(){clearTimeout(timer);timer=null;}
function setMode(next,message){mode=next;status.textContent=message;runButton.innerHTML=next==='running'?'Pause <span aria-hidden="true">Ⅱ</span>':next==='paused'?'Continue <span aria-hidden="true">↗</span>':next==='done'?'Run again <span aria-hidden="true">↗</span>':'Run program <span aria-hidden="true">↗</span>';}
function resetProgram(){cancel();pc=0;vars={};loops={};lineCount=0;clearScreen();listing.querySelectorAll('.active').forEach(l=>l.classList.remove('active'));machine.textContent='Ready';canvas.setAttribute('aria-label','Spectrum-style screen, blank until the program runs');explanation.textContent='FOR repeats the loop. PLOT sets the starting point. DRAW adds a line relative to that point.';setMode('ready','Ready when you are.');}
function execute(){
  const p=program[pc];listing.querySelectorAll('.basic-line').forEach((l,i)=>l.classList.toggle('active',i===pc));explanation.textContent=explanations[pc];let next=pc+1;
  if(p.op==='CLS')clearScreen();
  else if(p.op==='FOR'){
    const m=p.args.match(/^([a-z]+)=(.+) TO (.+) STEP (.+)$/i);vars[m[1]]=expression(m[2]);loops[m[1]]={start:pc+1,end:expression(m[3]),step:expression(m[4])};
  }else if(p.op==='PLOT'){const [x,y]=p.args.split(',').map(expression);plotX=Math.round(x);plotY=Math.round(y);pixel(plotX,plotY);}
  else if(p.op==='DRAW'){const [x,y]=p.args.split(',').map(expression);draw(x,y);}
  else if(p.op==='NEXT'){const loop=loops[p.args];vars[p.args]+=loop.step;if(vars[p.args]<=loop.end)next=loop.start;}
  machine.textContent=`Line ${p.number}${vars.n!==undefined?' / n = '+vars.n:''}`;pc=next;
  canvas.setAttribute('aria-label',`Spectrum-style screen showing a fan of ${lineCount} straight lines forming a curve`);
  return pc<program.length;
}
function complete(){cancel();setMode('done',`${lineCount} straight lines. A curve appears between them.`);machine.textContent='0 OK / '+lineCount+' lines';explanation.textContent='The lines are straight. Their spacing creates the curve. Change the spacing and run it again.';}
function tick(){
  timer=null;if(mode!=='running')return;
  try{if(execute())timer=setTimeout(tick,95);else complete();}catch(error){cancel();setMode('ready','The program stopped. Press Reset to try again.');machine.textContent='Program stopped';}
}
function runInstant(){cancel();try{let guard=0;while(execute()){if(++guard>1000)throw Error('Loop limit');}complete();}catch(error){resetProgram();status.textContent='The program stopped. Try resetting it.';}}
runButton.addEventListener('click',()=>{
  if(mode==='running'){cancel();setMode('paused','Paused. Continue to resume from this line.');return;}
  if(mode!=='paused')resetProgram();setMode('running','Running. Follow the highlighted line.');
  if(media.matches)runInstant();else tick();
});
document.getElementById('reset-basic').addEventListener('click',resetProgram);
spacing.addEventListener('change',()=>{buildProgram();resetProgram();status.textContent='Spacing changed. Run the new program.';});
function open(button){opener=button;lab.hidden=false;document.querySelectorAll('[data-open-lab]').forEach(o=>o.setAttribute('aria-expanded','true'));document.getElementById('lab-title').focus({preventScroll:true});lab.scrollIntoView({behavior:'instant',block:'start'});}
function closeLab(){cancel();if(mode==='running')setMode('paused','Paused. Continue to resume from this line.');lab.hidden=true;document.querySelectorAll('[data-open-lab]').forEach(o=>o.setAttribute('aria-expanded','false'));opener?.focus();}
document.getElementById('close-lab').addEventListener('click',closeLab);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!lab.hidden&&lab.contains(document.activeElement))closeLab();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running'){cancel();setMode('paused','Paused while you were away. Continue when ready.');}});
media.addEventListener('change',()=>{if(media.matches&&mode==='running')runInstant();});
buildProgram();resetProgram();

return {open};
}
