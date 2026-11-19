export const DAY_SECONDS=1200;
export function cityClock(seconds,night=false){
  const hours=((night?23.1:18.3)+seconds*24/DAY_SECONDS%24+24)%24;
  const edge=Math.max(0,Math.min(1,(Math.cos((hours-12)*Math.PI/12)+.21)/.64));
  const light=edge*edge*(3-2*edge);
  const h=Math.floor(hours),m=Math.floor((hours-h)*60);
  return {hours,light,time:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`};
}
