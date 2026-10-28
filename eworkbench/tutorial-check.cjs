// DOM contract regression checks; this fixture does not render a browser or run CircuitJS1.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
class Element {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.listeners={};this.classList={add(){}};}
  append(...v){this.children.push(...v)}
  replaceChildren(...v){this.children=[...v]}
  addEventListener(event,fn){(this.listeners[event]??=[]).push(fn)}
  focus(){} select(){} remove(){} click(){return this.fire('click')}
  async fire(event){for(const fn of this.listeners[event]||[])await fn({target:this})}
}
process.chdir(path.join(__dirname, '..'));
const html=fs.readFileSync('eworkbench/index.html','utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length);
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
const location=new URL('http://test/eworkbench/?project=circuit-basics&schematic=voltage-divider');
const storage=new Map();let copied='';const errors=[];
const context=vm.createContext({
  URL,Blob,console:{error:e=>errors.push(e)},setTimeout(){},
  document:{baseURI:location.href,getElementById:id=>{assert.ok(elements[id],id);return elements[id]},createElement:tag=>new Element(tag),createTextNode:text=>text,body:new Element('body')},
  location,history:{replaceState(a,b,u){location.href=u.href}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  navigator:{clipboard:{writeText:async t=>{copied=t}}},window:{confirm:()=>true},
  fetch:async url=>{const file=path.join('.',new URL(url).pathname);const text=fs.readFileSync(file,'utf8');return {ok:true,json:async()=>JSON.parse(text),text:async()=>text}}
});
const code=fs.readFileSync('eworkbench/app.js','utf8');
const idle=()=>new Promise(resolve=>setImmediate(resolve));
async function run(s){return vm.runInContext(s,context)}
(async()=>{
  await vm.runInContext(code,context);await idle();await idle();
  assert.match(elements.lessonTitle.textContent,/1 \/ 3/);
  assert.equal(elements.lessonContent.children.filter(e=>e.className==='lesson-stage').length,4);
  assert.equal(elements.previousLessonBtn.disabled,true);
  elements.fieldNotes.value='divider notes';await elements.fieldNotes.fire('input');
  await run('selectSchematic("loaded-divider")');await idle();
  assert.equal(elements.fieldNotes.value,'');assert.match(elements.lessonTitle.textContent,/2 \/ 3/);
  elements.fieldNotes.value='loading notes';await elements.fieldNotes.fire('input');
  await elements.previousLessonBtn.fire('click');await idle();
  assert.equal(elements.fieldNotes.value,'divider notes');
  await run('selectSchematic("rc-charge")');await idle();
  assert.equal(elements.nextLessonBtn.disabled,true);
  elements.fieldNotes.value='capacitor notes';await elements.fieldNotes.fire('input');
  await elements.copyUpdateBtn.fire('click');
  assert.match(copied,/TODO-002/);assert.match(copied,/LESSON-003/);assert.match(copied,/Lesson roadmap node: STEP-004/);
  assert.match(copied,/Roadmap step: STEP-001/);assert.match(copied,/capacitor notes/);
  context.navigator.clipboard.writeText=async()=>{throw Error('denied')};
  await elements.copyUpdateBtn.fire('click');assert.equal(elements.manualCopyText.hidden,false);
  await run('selectSchematic("loaded-divider")');assert.equal(elements.manualCopyText.hidden,true);
  assert.equal(elements.fieldNotes.value,'loading notes');
  await run('selectProject("wireless-mic")');await idle();
  assert.equal(elements.tutorialSection.hidden,true);assert.match(elements.fieldNotesLabel.textContent,/STEP-004/);
  elements.fieldNotes.value='mic notes';await elements.fieldNotes.fire('input');
  await run('selectProject("circuit-basics", "rc-charge")');await idle();
  assert.equal(elements.fieldNotes.value,'capacitor notes');
  await run('selectProject("wireless-mic")');await idle();assert.equal(elements.fieldNotes.value,'mic notes');
  assert.equal(errors.length,0);
  console.log('PASS: DOM integration for lesson rendering/navigation, notes isolation/persistence, handoff/fallback, deep links, and microphone project switching.');
})().catch(e=>{console.error(e);process.exit(1)});
