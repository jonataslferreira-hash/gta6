const TURN=Math.PI*2;
export function hudDirection(cameraYaw,from,to){
  const dx=to.x-from.x,dz=to.z-from.z,distance=Math.hypot(dx,dz);
  const wanted=Math.atan2(-dx,-dz),delta=wanted-cameraYaw;
  const angle=(delta%TURN+TURN*1.5)%TURN-Math.PI;
  return {distance,degrees:-angle*180/Math.PI};
}
export function shortDistance(distance){return distance>=1000?`${(distance/1000).toFixed(1).replace('.',',')} km`:`${Math.round(distance)} m`;}
export function speedometer(speed){const kmh=Math.round(Math.abs(speed)*3.6);return {text:String(kmh).padStart(3,'0'),reverse:speed<-.6,progress:Math.min(1,kmh/83)};}
