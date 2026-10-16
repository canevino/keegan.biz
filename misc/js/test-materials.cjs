/* Run from repository root: node misc/js/test-materials.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
global.window=global;
for(const name of ['core','pigment','finish','geometry','spatial','composition','species','ornament','botany','render']) {
 vm.runInThisContext(fs.readFileSync(path.join(__dirname,`${name}.js`),'utf8'),{filename:`${name}.js`});
}
const M=window.MS;
const s={pattern:'random',geometry:'gothic-pointed',conform:58,ornament:45,species:'holly',season:'summer',palette:'kells',seed:472818,foliage:70,detail:52,distortion:20,pigment:0,wear:0,spread:0,printWarp:0,registration:0};
const placements=markup=>[...markup.matchAll(/<g data-species="([^"]+)" transform="([^"]+)"/g)].map(a=>a[1]+a[2]);
const baseline=M.render(s),altered=M.render({...s,pigment:100,wear:100,spread:100,printWarp:100,registration:100});
if(JSON.stringify(placements(baseline))!==JSON.stringify(placements(altered)))throw Error('Print settings have changed leaf placement');
if(altered===baseline)throw Error('Material settings did not alter artwork');
if(!altered.includes('tonal-alpha')||!altered.includes('<mask'))throw Error('Missing material layers');
if(M.verifySpectral().available)throw Error('This smoke test expects the offline mode');
const fixtureColor=class {constructor(v){this.v=v}};
global.spectral={Color:fixtureColor,mix:(...layers)=>({toString:()=>layers[0][0].v})};
if(!M.verifySpectral().working)throw Error('Spectral.js 3 call pattern failed');
console.log(`PASS: ${placements(baseline).length} matching leaf placements; print changes are isolated; offline fallback and documented spectral.js 3 interface work`);
