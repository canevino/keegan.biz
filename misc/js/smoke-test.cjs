/* npm-free smoke test: node misc/js/smoke-test.cjs */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
global.window=global;
for(const mod of ['core','pigment','finish','composition','botany','render']){
  vm.runInThisContext(fs.readFileSync(path.join(__dirname,mod+'.js'),'utf8'),{filename:mod});
}
const M=window.MS;
const base={pattern:'random',palette:'kells',seed:472818,foliage:70,detail:52,pigment:46,distortion:20,wear:35,spread:46,registration:28,bleed:true,transparent:true};
for(const pattern of ['random','single','crescent','diagonal','radiating','meander','cluster']){
  const s={...base,pattern},render=M.render(s);
  assert.equal(render,M.render(s),'same seed must regenerate identical art');
  assert.notEqual(render,M.render({...s,seed:12345}),'different seeds should change art');
  assert(render.includes('<svg')&&render.endsWith('</svg>'));
  assert(!render.includes('NaN')&&!render.includes('undefined'));
  assert(!render.includes('<text')&&!render.includes('knotCartouche'),'botanical only');
  for(const extreme of [0,100]){
    const e=M.render({...s,foliage:extreme,detail:extreme,pigment:extreme,distortion:extreme,wear:extreme,spread:extreme,registration:extreme});
    assert(!e.includes('NaN')&&!e.includes('undefined'));
  }
  console.log(pattern,'passed');
}
let usedSpectral=0;
window.spectral={Color:class Color {constructor(value){this.value=value;}},mix(...colors){usedSpectral++;return{toString(){return '#406044';}}}};
assert.equal(M.mix('#123456','#789abc',.43),'#406044');
assert(usedSpectral>0,'actual Spectral.js API path should be callable');
console.log('All smoke tests passed; Spectral API adapter tested with a stand-in.');
