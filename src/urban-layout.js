// Scenic park road crosses large parcels in the western reserve. The arterial
// grid remains available to campaign GPS and traffic, and the park road is drivable.
export const reserveRoad=[[-786,228],[-758,254],[-733,269],[-698,284],[-675,314],[-646,332],[-613,352]];
export const carriagewayHalfWidth=8.5;
export function clearOfRoads(x,z,xs,zs,margin=.4){
  const safe=carriagewayHalfWidth+margin;
  return xs.every(axis=>Math.abs(x-axis)>=safe)&&zs.every(axis=>Math.abs(z-axis)>=safe);
}
export function reserveRoadDistance(x,z){
  return reserveRoad.slice(1).reduce((best,[bx,bz],i)=>{
    const [ax,az]=reserveRoad[i],dx=bx-ax,dz=bz-az;
    const f=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    return Math.min(best,Math.hypot(x-ax-dx*f,z-az-dz*f));
  },Infinity);
}

// Reclaimed local streets merge small blocks into larger parks and depots.
// Each closure is one span, leaving its cross streets and arterial exits intact.
export const reclaimedSpans=[
  ['x',1,6],['x',1,7],['x',1,8],['x',2,8],['x',2,9],['x',1,10],
  ['z',0,8],['z',1,8],['z',1,10],['z',2,10],
  ['x',2,1],['x',3,2],['x',4,2],['z',2,2],['z',4,3],
  ['x',6,9],['z',5,10],['x',7,11],['z',7,12],['z',8,12],
  ['x',9,11],['x',11,12],['z',10,12],['z',11,12],['x',13,11],
];
const closures=new Set(reclaimedSpans.map(v=>v.join(':')));
export const openSpan=(axis,i,j)=>!closures.has(`${axis}:${i}:${j}`);
export function streetSpans(xs,zs,visit){
  for(let i=0;i<xs.length;i++)for(let j=0;j<zs.length;j++){
    if(j+1<zs.length)visit('x',i,j,xs[i],zs[j],xs[i],zs[j+1],openSpan('x',i,j));
    if(i+1<xs.length)visit('z',i,j,xs[i],zs[j],xs[i+1],zs[j],openSpan('z',i,j));
  }
}
export function makeUrbanRouter(xs,zs){
  const nodes=xs.flatMap(x=>zs.map(z=>({x,z}))),roads=nodes.map(()=>[]),n=zs.length;
  streetSpans(xs,zs,(axis,i,j,x,z,x2,z2,open)=>{
    if(!open)return;const a=i*n+j,b=a+(axis==='x'?1:n),cost=Math.hypot(x2-x,z2-z);
    roads[a].push([b,cost]);roads[b].push([a,cost]);
  });
  const nearest=(values,v)=>values.reduce((best,k,i)=>Math.abs(v-k)<Math.abs(v-values[best])?i:best,0);
  let key,cached;
  return (from,to)=>{
    const ai=nearest(xs,from.x),aj=nearest(zs,from.z),bi=nearest(xs,to.x),bj=nearest(zs,to.z),a=ai*n+aj,b=bi*n+bj;
    const address=`${a}:${b}`;
    if(address!==key){
      key=address;const dist=nodes.map(()=>Infinity),parent=nodes.map(()=>-1),visited=new Set();dist[a]=0;
      while(visited.size<nodes.length){
        let min=-1;
        for(let i=0;i<dist.length;i++)if(!visited.has(i)&&Number.isFinite(dist[i])&&(min<0||dist[i]<dist[min]))min=i;
        if(min<0||min===b)break;visited.add(min);
        for(const [next,cost] of roads[min])if(dist[min]+cost<dist[next]){dist[next]=dist[min]+cost;parent[next]=min;}
      }
      cached=[];for(let at=b;at>=0;at=parent[at])cached.push(nodes[at]);cached.reverse();
    }
    const join=(p,q)=>Math.abs(p.x-q.x)<Math.abs(p.z-q.z)?{x:q.x,z:p.z}:{x:p.x,z:q.z};
    return [from,join(from,nodes[a]),...cached,join(to,nodes[b]),to];
  };
}
