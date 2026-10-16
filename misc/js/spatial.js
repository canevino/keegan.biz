/* Lightweight scene-wide collision field for foliage and branch terminals.
   It gently discourages unreadable stacks without flattening dense planting. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.makeSpatialField=()=>{
   const cell=44, buckets=new Map();
   const ix=x=>Math.floor(x/cell);
   const key=(x,y)=>x+','+y;
   const nearby=(p,radius)=>{
     const reach=Math.ceil((radius+60)/cell),x=ix(p.x),y=ix(p.y),out=[];
     for(let a=x-reach;a<=x+reach;a++)for(let b=y-reach;b<=y+reach;b++){
       const bucket=buckets.get(key(a,b));if(bucket)out.push(...bucket);
     }
     return out;
   };
   return {
     register(p,radius=10,group=''){
       const item={x:p.x,y:p.y,r:radius,group};
       const k=key(ix(p.x),ix(p.y));
       if(!buckets.has(k))buckets.set(k,[]);
       buckets.get(k).push(item);
     },
     // Existing leaves on the same spray are allowed more natural overlap.
     accept(p,radius,{group='',density=60,ignore=false}={}){
       if(ignore){this.register(p,radius,group);return true;}
       const fill=M.clamp(Number(density)/100,0,1);
       // At high density the leaves may touch, but must not completely stack.
       const minFactor=1.00-fill*.075;
       for(const old of nearby(p,radius)){
         const dx=p.x-old.x,dy=p.y-old.y;
         const proximity=(radius+old.r)*minFactor*(group===old.group?.91:1);
         if(dx*dx+dy*dy<proximity*proximity)return false;
       }
       this.register(p,radius,group);
       return true;
     }
   };
 };
})(window.MS);
