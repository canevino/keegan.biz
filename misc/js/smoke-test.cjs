/* Run: node js/smoke-test.cjs — no npm modules or network needed. */
const fs=require('node:fs'), path=require('node:path'),vm=require('node:vm');
global.window=global;
for(const name of ['core','pigment','finish','composition','species','botany','render']){
  vm.runInThisContext(fs.readFileSync(path.join(__dirname,name+'.js'),'utf8'),{filename:name+'.js'});
}
const M=window.MS;
const opts={pattern:'random',palette:'kells',season:'summer',seed:472818,foliage:70,detail:52,pigment:46,distortion:20,wear:35,spread:46,registration:28,bleed:true,transparent:true};
let count=0;
for(const species of [...M.speciesNames,'random','hybrid'])for(const season of ['spring','summer','autumn','winter']){
  const s={...opts,species,season};
  const a=M.render(s),b=M.render(s);
  if(a!==b)throw new Error(`Non deterministic: ${species} ${season}`);
  if(/(?:NaN|undefined|Infinity)/.test(a))throw new Error(`Invalid values: ${species} ${season}`);
  if(!a.startsWith('<svg')|| !a.endsWith('</svg>'))throw new Error(`SVG broken: ${species} ${season}`);
  count++;
}
for(const pattern of ['single','crescent','diagonal','radiating','meander','cluster']){
  const s={...opts,species:'bramble',pattern};
  if(!M.render(s).includes('artwork-layers'))throw new Error(pattern);
  count++;
}
for(const level of [0,1,100]){
  const s={...opts,species:'holly',foliage:level,pigment:level,wear:level,registration:level,detail:level};
  if(/(?:NaN|undefined|Infinity)/.test(M.render(s)))throw new Error('Extreme '+level);
  count++;
}
console.log(`PASS: ${count} species/season/layout/extreme combinations`);
