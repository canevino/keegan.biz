/* Optional development-only smoke tests: node js/smoke-test.cjs */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
global.window=global;
for(const file of ['core','pigment','finish','interlace','composition','botany','glyphs','initials','render']){
  eval(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'));
}
const base={palette:'kells',initial:'B',seed:472818,foliage:70,knots:60,detail:52,fragments:12,pigment:46,distortion:20,wear:35,initialVisible:true,bleed:true,transparent:true};
for(const mode of ['botanical','letter','interlace']){
  const s={...base,mode};
  const a=window.MS.render(s),b=window.MS.render(s);
  assert.equal(a,b,mode+' reproducibility');
  assert.notEqual(a,window.MS.render({...s,seed:34}),mode+' variation');
  assert(a.startsWith('<svg')&&a.endsWith('</svg>'),'svg should serialize');
  assert(!a.includes('undefined')&&!a.includes('NaN'),'no invalid coordinates');
  assert(!a.includes('<rect width="850" height="1000"'),'art should be transparent');
  for(const extreme of [0,100]){
    const e=window.MS.render({...s,foliage:extreme,knots:extreme,detail:extreme,pigment:extreme,wear:extreme,distortion:extreme,fragments:extreme});
    assert(e.includes('viewBox="0 0 850 1000"'),'bounds present');
    assert(!e.includes('NaN'),'extreme settings remain valid');
  }
  console.log(mode,'passed');
}
for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
  const glyph=window.MS.glyph(ch,300,window.MS.rng(101));
  assert(glyph.paths.length>0,`${ch} has custom outlines`);
  assert(glyph.terminals.length>=2,`${ch} has attached pen terminals`);
  assert(!glyph.shape.includes('<text'),`${ch} uses vector silhouettes, not fonts`);
}
const demo=window.MS.render({...base,mode:'botanical'});
assert(demo.includes('drawn-initial'),'custom initial renders');
assert(demo.includes('cartouche-'),'cartouche renders');
assert(demo.includes('braid-'),'botanical weaving renders');
console.log('All 26 glyphs and integrated ornaments passed.');
console.log('All SVG smoke tests passed.');
