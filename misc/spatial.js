/* Botanical spacing in real leaf units; no loose foliage sprites.
   Uses deterministic spatial hashing, broad-phase circles and distances from
   woody axes. A small contact overlap is allowed, dense collisions are not. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.makeSpatialField=()=>{
   const size=48,buckets=new Map(),axes=[];
   const ix=x=>Math.floor(x/size),key=(x,y)=>x+','+y;
   const register=(p,r,group)=>{
     const k=key(ix(p.x),ix(p.y));
     if(!buckets.has(k))buckets.set(k,[]);
     buckets.get(k).push({x:p.x,y:p.y,r,group});
   };
   const dist2=(p,a,b)=>{
     const dx=b.x-a.x,dy=b.y-a.y,ll=dx*dx+dy*dy||1;
     const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/ll));
     return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
   };
   return {
     register,
     addWood(points,width,group){
       if(!points?.length)return;
       for(let i=0;i<points.length-3;i+=3){
         axes.push({a:points[i],b:points[Math.min(i+3,points.length-1)],
           r:Math.max(.7,width*.3),group});
       }
     },
     accept(p,r,{group='',density=50,anchor=null}={}){
       const near=Math.ceil((r+60)/size),x=ix(p.x),y=ix(p.y);
       const crowdFactor=1.04-M.clamp((Number(density)-35)/100,0,.45)*.08;
       for(let a=x-near;a<=x+near;a++)for(let b=y-near;b<=y+near;b++){
         for(const old of buckets.get(key(a,b))||[]){
           const dx=p.x-old.x,dy=p.y-old.y;
           const threshold=(r+old.r)*crowdFactor*(old.group===group?.92:1.04);
           if(dx*dx+dy*dy < threshold*threshold)return false;
         }
       }
       // Blade centers cannot sit on a large woody axis; stems and leaves
       // may touch around their authentic attachment points.
       for(const axis of axes){
         const reach=Math.min(18,axis.r+Math.max(6,r*.42));
         if(dist2(p,axis.a,axis.b)<reach*reach){
           if(anchor&&axis.group===group&&dist2(anchor,axis.a,axis.b)<14*14){
             // Leaf genuinely begins on this branch; do not falsely reject it
             // because the petiole intersects the branch at its socket.
             if(dist2(p,axis.a,axis.b)<(axis.r+2.5)**2)return false;
           } else return false;
         }
       }
       register(p,r,group);
       return true;
     }
   };
 };
})(window.MS);
