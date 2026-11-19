export const getawayRoute=[
  {kind:'launch',x:208.6,z:119,label:'Saia da avenida do cassino',keys:'W / ↑',touch:'EMPURRE O JOYSTICK',tip:'Segure para ganhar velocidade. Passe pelo primeiro arco.'},
  {kind:'turn',x:204,z:96,label:'Vire à esquerda no cruzamento',keys:'A D / ← →',touch:'INCLINE O JOYSTICK',tip:'Siga o próximo arco e entre na rua transversal.'},
  {kind:'drive',x:140,z:96,label:'Corte por Miramar',keys:'W + A / D',touch:'CONTROLE O JOYSTICK',tip:'Atravesse a rua transversal até a avenida seguinte.'},
  {kind:'drive',x:138,z:32,label:'Suba até o Quiosque Seis',keys:'D / →',touch:'VIRE À DIREITA',tip:'Vire à direita e siga ao norte pelo próximo quarteirão.'},
  {kind:'drive',x:201,z:30,label:'Volte para a orla',keys:'D / →',touch:'VIRE À DIREITA',tip:'Vire à direita mais uma vez. O carro preto ficou para trás.'},
  {kind:'stop',x:209,z:73.5,label:'Pare perto do Vestiário Neon',keys:'ESPAÇO',touch:'SEGURE ↑ PARA FREAR',tip:'Vire à direita na avenida, chegue à área dourada e freie.'},
  {kind:'exit',x:209,z:73.5,label:'Saia do carro',keys:'E / CLIQUE',touch:'TOQUE NA MÃO',tip:'Despiste os seguranças mudando de roupa no Vestiário Neon.'},
];
export const cleanState=()=>({steer:0,vx:0,vz:0});
export function advanceGetaway(progress,{distance,speed,inCar}){
  const step=getawayRoute[progress];if(!step)return progress;
  if(step.kind==='exit')return !inCar?progress+1:progress;
  if(!inCar)return progress;
  if(step.kind==='stop')return distance<7.3&&Math.abs(speed)<.66?progress+1:progress;
  return distance<(progress===0?6:6.5)?progress+1:progress;
}
