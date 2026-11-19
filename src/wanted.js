export const cleanWanted=()=>({heat:0,quiet:0});
export function wantedStep(last,dt,{incident=0,seen=false,floor=0}={}){
  const heat=Math.min(5,Math.max(floor,last.heat+incident));
  const quiet=seen||incident>0?0:last.quiet+dt;
  const cool=quiet>9?dt*(.15+(quiet>22?.09:0)):0;
  return {heat:Math.max(floor,heat-cool),quiet};
}
export const starsFor=heat=>Math.min(5,Math.ceil(Math.max(0,heat-.03)));
