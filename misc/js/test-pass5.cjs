/* Pass 5 smoke test — run: node misc/js/test-pass5.cjs */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ctx={window:{},console};ctx.window.MS={};vm.createContext(ctx);
for(const file of ['core','pigment','finish','geometry','spatial','drawing','composition','species','ornament','botany','render']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,file+'.js'),'utf8'),ctx,{filename:file+'.js'});
}
const M=ctx.window.MS,assert=(c,msg)=>{if(!c)throw Error(msg)};
const base={geometry:'gothic-ogee',pattern:'crescent',conform:55,ornament:46,guideOverlay:false,species:'holly',season:'summer',palette:'kells',seed:472818,foliage:70,detail:52,pigment:46,distortion:20,printWarp:20,wear:35,spread:46,registration:28,bleed:true,transparent:true};
const sample=[{x:110,y:890},{x:150,y:730},{x:175,y:560},{x:290,y:450},{x:340,y:220}];
const sampled=M.resampleStroke(sample);assert(sampled.length===101,'path length');
assert(Math.abs(sampled[0].x-110)<1,'path starts at root');
assert(Math.abs(sampled[100].x-340)<1,'path retains terminal');
assert(!M.resampleStroke([{x:1,y:1},{x:3,y:4}]).length,'reject accidental taps');
let count=0;
for(const species of ['holly','hazel','ivy','hawthorn','oak','dogrose','honeysuckle','bramble','fern','acanthus','random','hybrid']){
 for(const geometry of ['gothic-pointed','celtic-scroll','anglo-lozenge']){
   const settings={...base,species,geometry,drawnPaths:[sample]};
   const scene=M.render(settings);
   assert(scene.startsWith('<svg')&&scene.includes('data-trunk'),`manual SVG failed ${species}`);
   assert(!scene.includes('construction-guides'),'guides must not export by default');
   const scene2=M.render(settings);assert(scene===scene2,`non-deterministic ${species}`);
   const newGeometry=M.render({...settings,geometry:'celtic-double-spiral'});
   assert(scene===newGeometry,'hand-drawn plant must ignore auto guide choice');
   const plan=M.plan(settings,M.rng(M.childSeed(settings.seed,0xaced0081)));
   assert(plan.stems.length===1 && plan.stems[0].userDrawn,'manual path override');
   const same=M.render({...settings,pigment:100,wear:100,spread:100,printWarp:100,registration:100});
   assert(same!==scene,'material controls did not change scene');
   count++;
 }
}
for(const geometry of ['gothic-pointed','gothic-quatrefoil','gothic-ogee','gothic-radial','anglo-lozenge','anglo-fret','anglo-saltire','celtic-triskele','celtic-double-spiral','celtic-scroll']){
 const scene=M.render({...base,geometry,drawnPaths:[]});
 assert(scene.includes('id="artwork-layers"'),`automatic geometry ${geometry}`);
 count++;
}
console.log(`PASS: ${count} integration combinations, deterministic hand-drawn growth, and degenerate stroke handling`);
// Representative cross-product coverage. Sliders are continuous; exhaustive
// combinations are infinite, so use balanced representative values instead.
const families=['gothic-pointed','gothic-quatrefoil','gothic-ogee','gothic-radial','anglo-lozenge','anglo-fret','anglo-saltire','celtic-triskele','celtic-double-spiral','celtic-scroll'];
const kinds=['holly','hazel','ivy','hawthorn','oak','dogrose','honeysuckle','bramble','fern','acanthus'];
let combinations=0;
for(let g=0;g<families.length;g++)for(let k=0;k<kinds.length;k++){
 const s={...base,drawnPaths:[],geometry:families[g],species:kinds[k],
   season:['spring','summer','autumn','winter'][(g+k)%4],
   ornament:[0,45,100][(g+k)%3],
   printWarp:[0,35,100][(g+2*k)%3],
   wear:[0,35,100][(g+k)%3],
   seed:[472818,132022,768555][(g+k)%3]};
 const result=M.render(s);
 assert(result.includes('data-plant')||result.includes('data-trunk'),`cross product ${g},${k}`);
 combinations++;
}
console.log(`PASS: ${combinations} additional species × geometry cross-product cases, rotated seasons, ornament and material extremes`);
