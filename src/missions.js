export const sideJobs = [
 {id:'arcade',name:'Fliperama do Píer',x:214,z:71,area:'Ocean Beach',glyph:'✦',reward:110,kind:'puzzle',desc:'Repita a sequência do letreiro no jogo de memória.',puzzle:{title:'Memória neon',clue:'Decore a sequência que as luzes piscam. Depois, repita no painel.',symbols:['SOL','ONDA','ESTRELA','LUA'],order:[0,2,1,3,2],preview:true}},
 {id:'vinyl',name:'Discos na areia',x:220,z:86,area:'Ocean Beach',glyph:'♫',reward:180,kind:'hunt',desc:'Recolha três discos esquecidos nos quiosques.',route:[{x:233,z:66,label:'Ver atrás da cadeira'},{x:246,z:87,label:'Recolher disco da areia'},{x:219,z:117,label:'Ver atrás do banco'}]},
 {id:'race',name:'Circuito da Orla',x:204,z:165,area:'South Point',glyph:'⚑',reward:270,kind:'drive',time:78,desc:'Passe pelos portais de carro antes de acabar o tempo.',route:[{x:204,z:103},{x:204,z:24},{x:204,z:-56},{x:204,z:-136},{x:204,z:-226},{x:163,z:-234},{x:96,z:-234}]},
 {id:'delivery',name:'Turno no Café Sereia',x:-51,z:84,area:'Miramar',glyph:'▣',reward:160,kind:'stops',time:175,desc:'Entregue os pedidos pessoalmente, sem passar direto.',route:[{x:-56,z:29,label:'Entregar pedido 1'},{x:11,z:-28,label:'Entregar pedido 2'},{x:76,z:-99,label:'Entregar pedido 3'}]},
 {id:'lookout',name:'Postal da Marina',x:245,z:-218,area:'Porto Violeta',glyph:'◉',reward:90,kind:'photo',desc:'Enquadre a roda-gigante girando a câmera e tire um postal.',route:[{x:245,z:-218,label:'Fotografar a roda-gigante'}]},
 {id:'parking',name:'Valet do Lúmen',x:-116,z:-109,area:'Distrito Art Déco',glyph:'P',reward:210,kind:'park',time:110,desc:'Estacione e pare dentro das duas vagas marcadas.',route:[{x:-121.5,z:-126,label:'Vaga 1'},{x:-121.5,z:-79,label:'Vaga 2'}]},
];
export const intro = [
 ['Luzia','Deixa tocar. Faz anos que eu não ouço essa estação.'],
 ['Davi','Viu o néon do Quiosque Seis? Me encontra ali. A chave já está no seu bolso.'],
 ['Luzia','A do carro. E essa outra, pequenininha?'],
 ['Davi','Testa os freios primeiro. Depois você olha o porta-luvas.']
];
export const campaign = [
 {name:'01 / As duas chaves',steps:[
   {kind:'talk',x:214,z:30,label:'Falar com Davi',goal:'Encontre Davi no Quiosque 06.',lines:[['Davi','O pedal afunda um pouco. Antes de pegar a avenida, testa no trecho marcado.'],['Luzia','Você fala do pedal como se fosse saudade.']]},
   {kind:'park',x:209.2,z:-19,label:'Teste de frenagem',goal:'Pegue um carro e pare dentro da faixa dourada da orla.'},
   {kind:'park',x:208.8,z:-68,label:'Segundo teste de frenagem',goal:'Faça um segundo teste: freie até zerar na próxima faixa.'},
   {kind:'talk',x:214,z:-68,label:'Abrir o porta-luvas',goal:'Saia do carro e examine o envelope na calçada.',lines:[['Luzia','Uma foto, um negativo e… açúcar do Sereia. Nara sempre guardava os sachês.']]},
 ]},
 {name:'02 / Mesa do fundo',steps:[
   {kind:'talk',x:-51,z:84,label:'Falar com Nara',goal:'Procure Nara no Café Sereia.',lines:[['Nara','Na foto, o letreiro está de ponta-cabeça. Na mesa tem três negativos. Qual deles pega o reflexo certo?']]},
   {kind:'puzzle',x:-51,z:86,label:'Comparar os negativos',goal:'Compare os três negativos na mesa.',puzzle:{title:'O detalhe no reflexo',clue:'No papel de Nara: “um círculo acima de duas ondas”. Escolha o negativo que combina.',symbols:['≈ ≈ / ◯','◯ / ≈ ≈','◯ / △ △'],order:[1]}},
 ]},
 {name:'03 / O lado de fora',steps:[
   {kind:'use',x:238,z:-222,label:'Abrir a caixa de sinal',goal:'Encontre a caixa de luzes no píer do Porto Violeta.'},
   {kind:'puzzle',x:238,z:-222,label:'Regular as luzes do cais',goal:'Ligue as luzes do píer na ordem escrita atrás da foto.',puzzle:{title:'Sinal do cais',clue:'A anotação diz: “acenda a lua; a onda vem antes do sol”.',symbols:['SOL','LUA','ONDA'],order:[1,2,0]}},
   {kind:'talk',x:252,z:-222,label:'Recolher a fita',goal:'Vá até a ponta do píer e recolha a fita do Segunda Chance.',lines:[['Luzia','Segunda Chance. A tinta do nome ainda está fresca.'],['Davi','Se ainda tocar, traz pro Lúmen. A gente escuta de porta fechada.']]},
 ]},
 {name:'04 / A última faixa',steps:[
   {kind:'use',x:-116,z:-102,label:'Colocar a fita no deck',goal:'Leve a fita ao Clube Lúmen.'},
   {kind:'puzzle',x:-115,z:-102,label:'Operar o toca-fitas',goal:'Calibre o deck do Lúmen para ouvir a gravação.',puzzle:{title:'Última faixa',clue:'O bilhete preso ao deck diz: “Volte a fita ao início. Grave o silêncio antes de dar play”.',symbols:['PLAY','REC','REW','STOP'],order:[2,1,0]}},
   {kind:'talk',x:-115,z:-102,label:'Ouvir a gravação',goal:'Escute o que está no lado B da fita.',lines:[['Davi','Esse lado costumava estar em branco.'],['Luzia','Era onde ele gravava o mar. Espera.'],['Davi','Isso não é o mar. É o motor do teu carro.'],['Luzia','…Deixa tocar mais um pouco.']]},
 ]},
];
export function canStopInBay(position,speed,target){return Math.abs(speed)<.45&&Math.abs(position.x-target.x)<1.7&&Math.abs(position.z-target.z)<3.3;}
export function directionTo(p,target){return Math.atan2(p.x-target.x,p.z-target.z);}
export function angularError(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
