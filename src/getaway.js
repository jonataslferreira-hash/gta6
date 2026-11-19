export const getawayRoute=[
  {kind:'launch',x:208.6,z:119,label:'Acelere pela orla',keys:'W / ↑',touch:'EMPURRE O JOYSTICK',tip:'Segure para ganhar velocidade. Passe pelo primeiro arco.'},
  {kind:'turn',x:206,z:101,label:'Desvie do canteiro',keys:'A D / ← →',touch:'INCLINE O JOYSTICK',tip:'Vire um pouco para a esquerda e siga pelo segundo arco.'},
  {kind:'stop',x:210.5,z:73.5,label:'Pare junto ao calçadão',keys:'ESPAÇO',touch:'SEGURE ↑ PARA FREAR',tip:'Vire à direita, chegue à área dourada e freie.'},
  {kind:'exit',x:210.5,z:73.5,label:'Saia do carro',keys:'E / CLIQUE',touch:'TOQUE NA MÃO',tip:'Davi vai a pé. Saia do carro para começar a explorar.'},
];
export const cleanState=()=>({steer:0,vx:0,vz:0});
export function advanceGetaway(progress,{distance,speed,inCar}){
  if(!inCar)return progress===3?4:progress;
  if(progress===0&&distance<6 || progress===1&&distance<5.5 || progress===2&&distance<7.3&&Math.abs(speed)<.66)return progress+1;
  return progress;
}
