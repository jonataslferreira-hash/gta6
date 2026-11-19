export const sideJobs = [
 {id:'arcade',name:'Fliperama do Píer',x:214,z:71,area:'Ocean Beach',glyph:'✦',reward:110,kind:'puzzle',desc:'Repita a sequência do letreiro no jogo de memória.',puzzle:{title:'Memória neon',clue:'Decore a sequência que as luzes piscam. Depois, repita no painel.',symbols:['SOL','ONDA','ESTRELA','LUA'],order:[0,2,1,3,2],preview:true}},
 {id:'vinyl',name:'Discos na areia',x:220,z:86,area:'Ocean Beach',glyph:'♫',reward:180,kind:'hunt',desc:'Recolha três discos esquecidos nos quiosques.',route:[{x:233,z:66,label:'Ver atrás da cadeira'},{x:246,z:87,label:'Recolher disco da areia'},{x:219,z:117,label:'Ver atrás do banco'}]},
 {id:'race',name:'Circuito da Orla',x:204,z:165,area:'South Point',glyph:'⚑',reward:270,kind:'drive',time:78,desc:'Passe pelos portais de carro antes de acabar o tempo.',route:[{x:204,z:103},{x:204,z:24},{x:204,z:-56},{x:204,z:-136},{x:204,z:-226},{x:163,z:-234},{x:96,z:-234}]},
 {id:'delivery',name:'Turno no Café Sereia',x:-51,z:84,area:'Miramar',glyph:'▣',reward:160,kind:'stops',time:175,desc:'Entregue os pedidos pessoalmente, sem passar direto.',route:[{x:-56,z:29,label:'Entregar pedido 1'},{x:11,z:-28,label:'Entregar pedido 2'},{x:76,z:-99,label:'Entregar pedido 3'}]},
 {id:'lookout',name:'Postal da Marina',x:245,z:-218,area:'Porto Violeta',glyph:'◉',reward:90,kind:'photo',desc:'Enquadre a roda-gigante girando a câmera e tire um postal.',route:[{x:245,z:-218,label:'Fotografar a roda-gigante'}]},
 {id:'parking',name:'Valet do Lúmen',x:-116,z:-109,area:'Distrito Art Déco',glyph:'P',reward:210,kind:'park',time:110,desc:'Estacione e pare dentro das duas vagas marcadas.',route:[{x:-121.5,z:-126,label:'Vaga 1'},{x:-121.5,z:-79,label:'Vaga 2'}]},
];
export const intro = [
 ['Davi','Olha a orla. Domingo à noite e a cidade inteira fingindo que amanhã não existe.','wry'],
 ['Luzia','Bonito. Agora abaixa essa mala antes que alguém do cassino veja.','tense'],
 ['Davi','A do dinheiro tava cheia de papel. Trouxe a que tinha o nome do Avelar.','fear'],
 ['Luzia','Davi. O carro preto atrás da gente não virou em nenhuma das últimas três ruas.','shock'],
 ['Davi','O segurança me chamou pelo nome, Luz. A gente não foi lá roubar. Foi lá cair numa armadilha.','fear'],
 ['Luzia','Põe o cinto. A gente conversa quando eles não estiverem mais no espelho.','cold'],
];
export const getawayLines = [
 ['Davi','O carro preto acelerou. Vê a entrada do calçadão? Entra ali quando eu avisar.'],
 ['Luzia','Passamos. Agora fica quieto um segundo e escuta se eles viraram também.'],
 ['Davi','Foram reto. Eu desço aqui e vou pelo calçadão. Me encontra atrás do Quiosque Seis.'],
];
export const campaign = [
 {name:'01 / A mala errada',steps:[
   {kind:'talk',x:214,z:30,label:'Falar com Davi',goal:'Encontre Davi atrás do Quiosque 06. Descubra o que tinha na mala do cassino.',lines:[
     ['Davi','O cara que vendeu a planta do cassino acabou de aparecer na TV. Do lado do Avelar.','tense'],
     ['Luzia','Então o assalto foi uma encomenda. A gente ainda não sabe de quem.','wry'],
     ['Davi','Troquei de carro. A chave tá no teu bolso. O nosso ainda deve estar rodando com um rastreador.','fear'],
     ['Luzia','Vai pela praia. Eu passo na oficina e abro a mala. Se te seguirem, não leva ninguém pra casa.','anger'],
     ['Davi','Você fala igual ao pai quando me pegava mentindo.','wry'],
     ['Luzia','A diferença é que ele acreditava em você no fim.','cold']
   ]},
   {kind:'drive',x:209.2,z:-19,label:'Saída pela orla',goal:'Pegue o carro da fuga e atravesse o primeiro portal dourado.'},
   {kind:'park',x:208.8,z:-68,label:'Esconder o carro',goal:'Estacione na vaga marcada e saia para abrir a mala.'},
   {kind:'talk',x:214,z:-68,label:'Abrir a mala roubada',goal:'Saia do carro e confira o conteúdo da mala.',lines:[
     ['Luzia','Fotos de carregamentos. Nomes de policiais. Até os pagamentos tão anotados.','shock'],
     ['Luzia','Nara, eu sei que é tarde. Preciso que você veja uma coisa. E não quero que faça uma cópia no balcão.','tense']
   ]},
 ]},
 {name:'02 / Mesa do fundo',steps:[
   {kind:'talk',x:-51,z:84,label:'Falar com Nara',goal:'Leve as fotos do cassino a Nara, no Café Sereia.',lines:[
     ['Nara','O Avelar lava dinheiro no cassino. Isso aí é a contabilidade paralela dele. E olha quem recebeu ontem.','wry'],
     ['Luzia','Davi. Não foi o Avelar que comprou a planta. Foi meu irmão que vendeu o nosso assalto.','shock'],
     ['Nara','Tem uma fita que explica o pagamento. Era pra ir num barco hoje. Arruma o negativo certo e eu te digo o píer.','tense']
   ]},
   {kind:'puzzle',x:-51,z:86,label:'Comparar os negativos',goal:'Use as fotos roubadas para identificar o píer da entrega.',puzzle:{title:'O detalhe no reflexo',clue:'O brasão do Porto Violeta tem um círculo acima de duas ondas. Qual negativo mostra esse símbolo?',symbols:['≈ ≈ / ◯','◯ / ≈ ≈','◯ / △ △'],order:[1]}},
 ]},
 {name:'03 / O lado de fora',steps:[
   {kind:'use',x:238,z:-222,label:'Abrir a caixa de sinal',goal:'Chegue ao Porto Violeta e encontre a caixa que controla as luzes do píer.'},
   {kind:'puzzle',x:238,z:-222,label:'Dar o sinal combinado',goal:'Use o código atrás da foto para que o vigia deixe o cais livre.',puzzle:{title:'Sinal do cais',clue:'Atrás da foto está escrito: “acenda a lua; a onda vem antes do sol”.',symbols:['SOL','LUA','ONDA'],order:[1,2,0]}},
   {kind:'talk',x:252,z:-222,label:'Roubar a fita',goal:'Pegue a gravação escondida no barco Segunda Chance.',lines:[
     ['Luzia','Tô com a fita. E tô vendo teu nome no recibo, Davi.','anger'],
     ['Davi','Eu peguei o dinheiro. Não sabia que ele ia fechar as saídas com a gente lá dentro.','fear'],
     ['Luzia','Me encontra no Lúmen. Se você sumir agora, nem precisa ouvir o que tem nessa fita.','tense']
   ]},
 ]},
 {name:'04 / A última faixa',steps:[
   {kind:'use',x:-116,z:-102,label:'Colocar a fita no deck',goal:'Leve a gravação roubada ao Clube Lúmen.'},
   {kind:'puzzle',x:-115,z:-102,label:'Operar o toca-fitas',goal:'Rebobine a fita para ouvir a ligação gravada.',puzzle:{title:'Última faixa',clue:'O bilhete do técnico diz: “Rebobine até o início. Aperte STOP quando chegar. Só então dê PLAY”.',symbols:['PLAY','REC','REW','STOP'],order:[2,3,0]}},
   {kind:'talk',x:-115,z:-102,label:'Ouvir a gravação',goal:'Ouça o lado B da fita com Davi.',lines:[
     ['Avelar','O assalto cobre o sumiço do caixa. Depois, deixa a polícia achar os dois com a mala errada.','cold'],
     ['Davi','Ele disse que era um roubo de fachada. Que eu ia sair por uma porta e você pela outra.','fear'],
     ['Luzia','E depois você ia me contar o quê? Que a gente só teve sorte?','anger'],
     ['Davi','Que a gente ia embora. Eu já tinha comprado as passagens.','tense'],
     ['Luzia','Cancela a minha. Amanhã essa fita toca na Costa FM.','cold'],
     ['Davi','O Avelar escuta Costa FM.','shock'],
     ['Luzia','Eu sei. Ele paga o programa da manhã.','wry']
   ]},
 ]},
];
export function canStopInBay(position,speed,target){return Math.abs(speed)<.45&&Math.abs(position.x-target.x)<1.7&&Math.abs(position.z-target.z)<3.3;}
export function directionTo(p,target){return Math.atan2(p.x-target.x,p.z-target.z);}
export function angularError(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
