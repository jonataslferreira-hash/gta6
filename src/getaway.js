const gate=(kind,x,z,label,tip,keys='WASD / SETAS',touch='JOYSTICK')=>({kind,x,z,label,tip,keys,touch});
export const getawayRoute=[
  gate('launch',208.6,111,'Saia da avenida do cassino','Ganhe velocidade e siga o arco.'),
  gate('turn',204,96,'Vire para Miramar','Siga para oeste pelo cruzamento.'),
  gate('drive',138,96,'Cruze a Avenida do Sol','Siga pela transversal. Não pare no cruzamento.'),
  gate('turn',72,96,'Entre na Rua das Palmeiras','Vire ao norte.'),
  gate('drive',72,30,'Passe pela praça','Mantenha a direção.'),
  gate('turn',72,-36,'Contorne por trás do mercado','Suba mais um quarteirão e vire a oeste.'),
  gate('drive',-32,-36,'Atravesse Miramar','O perseguidor ainda está atrás.'),
  gate('turn',-126,-36,'Volte pela Avenida Violeta','Vire ao sul.'),
  gate('turn',-126,30,'Pegue a via da orla','Vire a leste. Deixe o trânsito entre vocês.'),
  gate('drive',-9,30,'Passe pelo viaduto','Continue a leste.'),
  gate('drive',108,30,'Desça para a orla','Siga na mesma rua até a avenida.'),
  gate('turn',204,30,'Desligue os faróis na orla','Última conversão, rumo ao Vestiário Neon.'),
  gate('stop',209,73.5,'Pare perto do Vestiário Neon','Pare dentro da vaga dourada.','ESPAÇO','SEGURE ↑ PARA FREAR'),
  gate('exit',209,73.5,'Saia do carro','Troque de roupa antes de continuar.','E','TOQUE NA MÃO'),
];
export const cleanState=()=>({steer:0,vx:0,vz:0});
export function advanceGetaway(progress,{distance,speed,inCar}){
  const step=getawayRoute[progress];if(!step)return progress;
  if(step.kind==='exit')return !inCar?progress+1:progress;
  if(!inCar)return progress;
  if(step.kind==='stop')return distance<7.3&&Math.abs(speed)<.66?progress+1:progress;
  return distance<(step.kind==='turn'?8:step.kind==='launch'?7:11)?progress+1:progress;
}
