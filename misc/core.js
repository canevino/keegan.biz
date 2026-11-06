/* Future-medieval botanical press: deterministic drawing utilities. No dependencies. */
(function (w) {
  'use strict';
  const B = w.BotanicalPress = {};
  B.W = 620;
  B.H = 710;
  B.clamp = (x, a, b) => Math.min(b, Math.max(a, Number(x) || 0));
  B.f = v => Number(v).toFixed(2).replace(/\.00$/, '');
  B.pt = p => `${B.f(p.x)} ${B.f(p.y)}`;
  B.esc = s => String(s).replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
  B.rng = seed => {
    let a = Number(seed) >>> 0;
    return {
      random() {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      float(min=0,max=1) { return min+(max-min)*this.random(); },
      int(min,max) { return Math.floor(this.float(min,max+1)); },
      pick(a) { return a[this.int(0,a.length-1)]; },
      chance(p) { return this.random()<p; }
    };
  };
  B.cubic = (a,b,c,d,t) => {
    const u = 1-t;
    return { x:u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x,
             y:u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y };
  };
  B.derivative = (a,b,c,d,t) => {
    const u=1-t;
    return { x:3*u*u*(b.x-a.x)+6*u*t*(c.x-b.x)+3*t*t*(d.x-c.x),
             y:3*u*u*(b.y-a.y)+6*u*t*(c.y-b.y)+3*t*t*(d.y-c.y) };
  };
  B.length = p => Math.hypot(p.x,p.y);
  B.unit = p => {const l=B.length(p)||1;return {x:p.x/l,y:p.y/l};};
  B.mix = (h1,h2,t) => {
    const a=h1.replace('#',''),b=h2.replace('#','');
    const c=(i)=>Math.round(parseInt(a.substring(i,i+2),16)*(1-t)+parseInt(b.substring(i,i+2),16)*t);
    return '#'+[0,2,4].map(i=>c(i).toString(16).padStart(2,'0')).join('');
  };
  B.palettes = {
    future:{paper:'#f1e9d9',green:'#213d2c',leaf:'#2f5536',deep:'#13251e',red:'#b8192c',rose:'#e93657',ochre:'#b76c21',ghost:'#788b6a',ash:'#b8a895',ink:'#25241b'},
    kells:{paper:'#f1e9d9',green:'#425436',leaf:'#546c42',deep:'#273325',red:'#a93230',rose:'#c64748',ochre:'#ad8137',ghost:'#859479',ash:'#b8ab98',ink:'#3a3325'},
    jewel:{paper:'#f1e9d9',green:'#1e4646',leaf:'#28685d',deep:'#14383a',red:'#c22b35',rose:'#e44358',ochre:'#ae8038',ghost:'#6f9290',ash:'#b8a895',ink:'#1e292a'},
    earth:{paper:'#efe5d2',green:'#41472d',leaf:'#6a7345',deep:'#343928',red:'#a7482c',rose:'#cd6743',ochre:'#a96a2b',ghost:'#a1a084',ash:'#b8a18b',ink:'#392c24'},
    site:{paper:'#eee8d8',green:'#006b48',leaf:'#00845a',deep:'#01442d',red:'#c1272d',rose:'#e94545',ochre:'#e0a300',ghost:'#78a78a',ash:'#c1b39d',ink:'#221f19'},
    monochrome:{paper:'#efe6d6',green:'#40372e',leaf:'#655947',deep:'#261e1a',red:'#803a2e',rose:'#ab5c43',ochre:'#b1976a',ghost:'#a79a84',ash:'#c0aa8a',ink:'#251e19'}
  };
  B.palette = name => B.palettes[name] || B.palettes.future;
  B.styles = {holly:'spiny',hazel:'ovate',ivy:'lobed',hawthorn:'spiny',oak:'lobed',dogrose:'ovate',honeysuckle:'ovate',bramble:'spiny',fern:'fern',acanthus:'acanthus',hybrid:'mix',random:'mix'};
})(window);
