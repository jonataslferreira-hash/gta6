const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ease=(t,a,b)=>{const x=clamp((t-a)/(b-a),0,1);return x*x*x*(x*(x*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*t;
const offset=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export const openingSeconds=14.2;

// One dolly move: frontal two-shot, then an arc to the same shoulder used in play.
// x/z are in the actual set, not coordinates on a replacement stage.
export function openingDolly(t,luzia,davi,yaw,pitch){
  const first=ease(t,0,5.8),portrait=ease(t,1.0,3.4)*(1-ease(t,6,8.1));
  const rotate=ease(t,7.15,13.55),handoff=ease(t,11.1,openingSeconds);
  const x=mix(luzia.x,davi.x,.44),z=mix(luzia.z,davi.z,.44);
  const angle=offset(mix(-2.80,-2.91,first),yaw+Math.atan2(.58,2.18),rotate),radius=mix(mix(2.04,1.68,first),Math.hypot(2.18,.58),handoff);
  return {
    x:mix(x,luzia.x,handoff)+Math.sin(angle)*radius,
    z:mix(z,luzia.z,handoff)+Math.cos(angle)*radius,
    y:mix(mix(1.51,1.44,portrait),2.34+pitch*.53,handoff),
    lx:mix(x,luzia.x,handoff),lz:mix(z,luzia.z,handoff),ly:mix(1.52,1.28,handoff),
    fov:mix(48-portrait*6,61,handoff)
  };
}

// The navigation lattice follows the actual collision layout, not a straight line through walls.
export function indoorRoute(from,to,blocked){
  const minX=-5.55,minZ=-11.42,step=.48,width=24,height=87,len=width*height;
  const world=id=>({x:minX+id%width*step,z:minZ+Math.floor(id/width)*step});
  const samples=Array.from({length:len},(_,i)=>world(i));
  const clear=samples.map(p=>!blocked(p.x,p.z,.33));
  const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  let nearest=-1,best=Infinity;
  for(let i=0;i<len;i++){if(!clear[i])continue;const dist=d(from,samples[i]);if(dist<best){nearest=i;best=dist;}}
  if(nearest<0)return [];
  const queue=new Int16Array(len),parents=new Int16Array(len).fill(-2);queue[0]=nearest;parents[nearest]=-1;
  const directions=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let head=0,tail=1;head<tail;head++){
    const at=queue[head],p=samples[at];
    if(d(p,to)<(to.radius||1.42)){
      const path=[];for(let i=at;i>=0;i=parents[i])path.push(samples[i]);
      return path.reverse();
    }
    const ax=at%width,az=Math.floor(at/width);
    for(const [dx,dz] of directions){
      const x=ax+dx,z=az+dz,i=z*width+x;if(x<0||x>=width||z<0||z>=height||!clear[i]||parents[i]!==-2)continue;
      const q=samples[i];if(blocked((p.x+q.x)*.5,(p.z+q.z)*.5,.33))continue;
      parents[i]=at;queue[tail++]=i;
    }
  }
  return [];
}
