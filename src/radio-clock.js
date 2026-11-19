const mod=(n,d)=>((n%d)+d)%d;
export function stationPosition(lengths,time){
  const total=lengths.reduce((a,b)=>a+b,0);if(!total)return {index:0,offset:0};
  let offset=mod(time,total),index=0;
  while(index<lengths.length-1&&offset>=lengths[index])offset-=lengths[index++];
  return {index,offset};
}
