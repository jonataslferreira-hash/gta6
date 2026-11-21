// Separate pools for ambient conversation and reactions; shared per scene so
// two adjacent pedestrians don't immediately repeat each other.
export const streetVoices = {
  orla: [
    ['Célia', 'Boa noite! Se for à praia, o vento tá forte perto do cais.', 'casino-06.mp3'],
    ['Beto', 'O fliperama ainda tá aberto. Depois da meia-noite fica bem mais vazio.', 'casino-07.mp3'],
    ['Célia', 'Ainda dá tempo de pegar um café ali na janela. A moça fica até mais tarde nas sextas.', 'orla-cafe.mp3'],
    ['Beto', 'Água gelada! Se for andar até o píer, leva uma. Lá na ponta não tem vendedor.', 'orla-vendedor.mp3'],
  ],
  esbarrao: [
    ['Marta', 'Ei! Calma aí, olha por onde anda.', 'casino-08.mp3'],
  ],
  transito: [
    ['Beto', 'Ô! Segura esse carro, beleza?', 'casino-09.mp3'],
    ['Célia', 'Cê não viu a faixa? Pisa no freio!', 'orla-freio.mp3'],
  ],
};
export const pedestrianRecordings = Object.fromEntries(Object.values(streetVoices).flat().map(([,text,file])=>[text,file]));
export function makeStreetDialogues(){
  const cursor=new Map();let last;
  return (kind,voice)=>{
    const pool=streetVoices[kind];if(!pool)return null;
    const preferred=pool.filter(([speaker,text])=>speaker===voice&&text!==last);
    const fresh=pool.filter(([,text])=>text!==last);
    const candidates=preferred.length?preferred:fresh.length?fresh:pool;
    const key=`${kind}:${voice??"geral"}`,index=cursor.get(key)||0;
    const line=candidates[index%candidates.length];cursor.set(key,index+1);last=line[1];return line;
  };
}
