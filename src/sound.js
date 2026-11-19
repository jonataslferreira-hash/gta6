import { voiceLines } from './voice-lines.js';

const originals=[
 {station:'Rádio Aurora',title:'Vidro Rosa',bpm:108, style:0, chords:[[45,57,60,64,67],[41,57,60,64,65],[48,55,60,64,67],[43,55,59,62,67]],lead:[[76,84,81,79],[77,76,72,69],[79,84,83,76],[74,71,79,74]]},
 {station:'Rádio Aurora',title:'Pista de Sal',bpm:116, style:0, chords:[[42,54,57,61,64],[38,54,57,61,62],[45,57,61,64,68],[40,56,59,64,68]],lead:[[78,81,85,81],[78,76,73,69],[76,81,85,88],[83,80,76,71]]},
 {station:'Costa FM',title:'Calçada Quente',bpm:102,style:1,chords:[[43,55,58,62,65],[48,55,58,64,67],[41,53,57,60,64],[46,53,57,62,65]],lead:[[74,77,70,72],[76,79,82,79],[76,72,69,72],[74,77,81,77]]},
 {station:'Costa FM',title:'Último Verão',bpm:96,style:1,chords:[[50,57,60,65,69],[43,55,59,62,65],[48,55,59,64,67],[45,57,60,64,67]],lead:[[77,81,84,77],[74,71,77,79],[76,79,83,76],[72,76,79,81]]},
 {station:'Canal Violeta',title:'Luzes do Cais',bpm:83,style:2,chords:[[44,56,59,63,66],[47,54,58,63,66],[42,54,57,61,64],[49,56,61,64,68]],lead:[[75,83,78,80],[78,75,73,70],[73,76,81,85],[80,88,85,80]]},
 {station:'Canal Violeta',title:'Maré de Neon',bpm:88,style:2,chords:[[48,55,58,63,67],[44,56,60,63,67],[46,53,58,62,65],[43,55,58,62,65]],lead:[[79,75,82,79],[84,79,75,72],[77,74,82,77],[74,77,70,67]]}
];
const stations=[
 {name:'Costa FM',tag:'TROPICAL / LATINA',tracks:[['Tropical Breeze','Flan','tropicalbreeze'],['Salsa Con Carne (remix)','DJ Gentoo / Mystical','salcon'],['Saharan Penguin','Enol “Meji” Monte','saharan_penguin'],['Sunset','SnugglyBun','sunset']]},
 {name:'Rádio Aurora',tag:'CHIPTUNE / ELETRÔNICA',tracks:[['Mortimer’s Chipdisko','Lukas Nystrand','chipdisko'],['Midday','SnugglyBun','midday'],['Midday (alternativa)','SnugglyBun','midday_alt'],['Skylevel','SnugglyBun','skylevel']]},
 {name:'Canal Violeta',tag:'AMBIENTE / NOTURNA',tracks:[['Night','SnugglyBun','night'],['Underwater','SnugglyBun','underwater'],['Glacier','SnugglyBun','glacier']]},
 {name:'Maré Alta FM',tag:'SESSÕES ORIGINAIS',tracks:originals.map((x,i)=>[x.title,'Maré Alta',null,i])},
 {name:'Rádio desligado',tag:'SÓ A CIDADE',tracks:[]},
];
let channel=0,song=0,media,atmosphere,engineLayer,engineFilter,engineBed,slowRate=1;
let ctx, master, music, engine, engineGain, noise, current=0, tick=0, next=0, timer, enabled=false, muted=false, gain=.65, suspended=false;
function ready(){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 if(!ctx){try{ctx=new AC();master=ctx.createGain();master.gain.value=muted?0:gain;master.connect(ctx.destination);music=ctx.createGain();music.gain.value=.44;music.connect(master);noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;engine=ctx.createOscillator();engine.type='sawtooth';const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=110;engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(f).connect(engineGain).connect(master);engine.start();}catch{return;}}
 if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 if(!engineFilter){engineFilter=ctx.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=115;engineLayer=ctx.createOscillator();engineLayer.type='triangle';engineLayer.connect(engineFilter).connect(engineGain);engineLayer.start();const road=ctx.createBufferSource();road.buffer=noise;road.loop=true;const tire=ctx.createBiquadFilter();tire.type='bandpass';tire.frequency.value=270;tire.Q.value=.25;engineBed=ctx.createGain();engineBed.gain.value=0;road.connect(tire).connect(engineBed).connect(master);road.start();}
 if(!atmosphere){const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noise;src.loop=true;f.type='lowpass';f.frequency.value=320;g.gain.value=0;src.connect(f).connect(g).connect(master);src.start();atmosphere={g,f};}
 if(!media){const audio=new Audio();audio.preload='none';audio.preservesPitch=false;audio.playbackRate=slowRate;const volume=ctx.createGain();volume.gain.value=.48;ctx.createMediaElementSource(audio).connect(volume).connect(master);audio.addEventListener('ended',()=>{song=(song+1)%stations[channel].tracks.length;selectTrack();});media={audio,volume};}
}
const hz=m=>440*2**((m-69)/12);
function tone(freq,t,len,amp,type='sine',cut=3300,bus=music,end=0){
 if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+len*.82);f.frequency.value=cut;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amp,t+Math.min(.024,len*.19));g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(f).connect(g).connect(bus);o.start(t);o.stop(t+len+.03);
}
function hit(t,len,amp,cut,type='highpass',bus=music){if(!ctx)return;const o=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.buffer=noise;f.type=type;f.frequency.value=cut;g.gain.setValueAtTime(amp,t);g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(f).connect(g).connect(bus);o.start(t,0,len);}
function schedule(t){
 const tr=originals[current], b=60/(tr.bpm*slowRate), k=tick%16, bar=Math.floor(tick/16)%32, ch=tr.chords[bar%4], section=Math.floor(bar/8), melody=tr.lead[bar%4];
 if(k===0){for(let i=1;i<5;i++){tone(hz(ch[i]),t+i*.008,b*3.88,.038,tr.style===0?'triangle':'sine',780);if(tr.style===2)tone(hz(ch[i]+12)*1.004,t,b*3.2,.012,'sine');}}
 if((tr.style===0?[0,4,8,12]:tr.style===1?[0,6,10]:[0,9]).includes(k))tone(121,t,.22,.38,'sine',220,music,42);
 if(k===4||k===12){hit(t,.105,.12,1330);tone(163,t,.09,.1,'triangle',560,music,97);}
 if(k%2===0&&(section!==2||k%4===2))hit(t,k%4===2?.085:.037,k%4===2?.062:.04,6400);
 if((tr.style===1?[0,3,6,10,14]:tr.style===2?[0,7,10]:[0,2,5,8,10,14]).includes(k))tone(hz(ch[0]+(k===14?12:k===10?7:0)),t,b*(tr.style===2?1.35:.67),.19,tr.style===0?'sawtooth':'triangle',tr.style===0?690:430);
 if(tr.style===0&&k%2===1&&section!==2)tone(hz(ch[1+Math.floor(k/2)%4]+12),t,b*.2,.04,'triangle',1700);
 const loc=(tr.style===0?[2,6,10,13]:tr.style===1?[1,7,10,15]:[0,6,11,14]).indexOf(k);
 if(loc>=0&&section!==0&&!(section===2&&loc%2===1)){
   const n=melody[(loc+(section===3&&bar%2?1:0))%4];tone(hz(n),t,b*(loc===3?.85:1.45),.093,tr.style===1?'sine':'triangle',1700);tone(hz(n),t+b*.74,b*.7,.023,'sine',1850);tone(hz(n-12),t,b*.8,.031,'triangle',950);
 }
 if(++tick>=16*32){song=(song+1)%stations[channel].tracks.length;current=stations[channel].tracks[song][3];tick=0;}
}
function startLoop(){if(!ctx||timer||!enabled||suspended)return;next=ctx.currentTime+.055;timer=setInterval(()=>{if(ctx.state!=='running')return;if(next<ctx.currentTime)next=ctx.currentTime+.02;while(next<ctx.currentTime+.16){const duration=15/(originals[current].bpm*slowRate);schedule(next);next+=duration;}},42);}
function stopLoop(){clearInterval(timer);timer=undefined;}
function selectTrack(){
 stopLoop(); const track=stations[channel].tracks[song];if(media)media.audio.pause();
 if(music)music.gain.setTargetAtTime(track&&Number.isInteger(track[3])?.44:0,ctx.currentTime,.12);
 if(!track||!enabled||suspended)return;
 if(track[2]&&media){const src=`${import.meta.env.BASE_URL}radio/${track[2]}.mp3`;if(media.audio.getAttribute('src')!==src)media.audio.src=src;media.audio.playbackRate=slowRate;media.audio.play().catch(()=>{});}
 else if(Number.isInteger(track[3])){current=track[3];tick=0;startLoop();}
}
export const radio={ready,stations,start(n=0){ready();enabled=true;suspended=false;channel=n===4?2:0;song=0;if(music)music.gain.value=.44;selectTrack();},
 slow(rate){slowRate=rate;if(media)media.audio.playbackRate=rate;if(spoken&&ctx)spoken.playbackRate.setTargetAtTime(rate,ctx.currentTime,.055);if(ctx&&timer)next=ctx.currentTime+.085;},
 stop(){this.slow(1);enabled=false;stopLoop();media?.audio.pause();this.motor(0,false);this.ambient(0,0);},
 pause(v){suspended=v;if(music)music.gain.setTargetAtTime(v||!Number.isInteger(stations[channel].tracks[song]?.[3])?0:.44,ctx.currentTime,.08);if(v){media?.audio.pause();stopLoop();this.motor(0,false);this.ambient(0,0);}else {const track=stations[channel].tracks[song];if(track?.[2])media?.audio.play().catch(()=>{});else if(track)startLoop();}},
 choose(n){ready();channel=(n+stations.length)%stations.length;song=0;selectTrack();sfx('select');return this.info();},change(){return this.choose(channel+1);},skip(){const tr=stations[channel].tracks;if(tr.length){song=(song+1)%tr.length;selectTrack();}return this.info();},
 info(){const [title='',artist='']=stations[channel].tracks[song]||[];return {station:stations[channel].name,title,artist,channel};},
 settings(c){gain=c.volume/100;muted=c.mute;if(master)master.gain.setTargetAtTime(muted?0:gain,ctx.currentTime,.04);},
 ambient(coast,t){if(!atmosphere)return;atmosphere.g.gain.setTargetAtTime(coast*(.03+.034*(Math.sin(t*.64)+1)),ctx.currentTime,.35);atmosphere.f.frequency.setTargetAtTime(290+80*Math.sin(t*.61),ctx.currentTime,.32);},
 motor(speed,active){if(!ctx||!engineGain)return;const v=Math.min(speed,25),t=ctx.currentTime;engine.frequency.setTargetAtTime(28+v*3.25,t,.09);engineLayer?.frequency.setTargetAtTime(42+v*4.85,t,.09);engineFilter?.frequency.setTargetAtTime(102+v*7.25,t,.12);engineBed?.gain.setTargetAtTime(active?v*.004:0,t,.14);engineGain.gain.setTargetAtTime(active?.037+v*.0021:0,t,.10);}};
export function sfx(kind){if(!ctx||!master||muted)return;const t=ctx.currentTime+.006;if(kind==='step'||kind==='sand'){const sand=kind==='sand';hit(t,sand?.148:.086,.06+Math.random()*.018,sand?1340:620+Math.random()*260,sand?'bandpass':'lowpass',master);tone(58+Math.random()*24,t,.09,sand?.020:.042,'sine',240,master,44);}if(kind==='door'){hit(t,.16,.19,380,'lowpass',master);tone(91,t,.13,.16,'triangle',260,master,41);}if(kind==='bump'){hit(t,.16,.13,650,'lowpass',master);}if(kind==='rattle'){hit(t,.10,.09,1300,'bandpass',master);hit(t+.053,.085,.07,800,'bandpass',master);}if(kind==='select'){tone(530,t,.115,.10,'triangle',1750,master);tone(795,t+.047,.14,.074,'sine',1750,master);}if(kind==='complete'){[60,64,67,72].forEach((n,i)=>tone(hz(n),t+i*.09,.45,.14,'triangle',2000,master));}}
let voiceConfig={voices:true, volume:65, mute:false}, spoken, speechSerial=0, analyser, samples;
const voiceBuffers=new Map();
function loadVoice(text){
  const file=voiceLines[text];if(!file||!ctx)return null;
  if(!voiceBuffers.has(file))voiceBuffers.set(file,fetch(`${import.meta.env.BASE_URL}voices/${file}`).then(result=>{
    if(!result.ok)throw new Error('Offline voice');return result.arrayBuffer();
  }).then(data=>ctx.decodeAudioData(data)).catch(()=>{voiceBuffers.delete(file);return null;}));
  return voiceBuffers.get(file);
}
export const speech={
 settings(c){voiceConfig=c;if(c.mute||!c.voices)this.stop();},
 preload(text){loadVoice(text);},
 level(){if(!spoken||!analyser)return 0;analyser.getByteTimeDomainData(samples);let energy=0;for(const x of samples)energy+=((x-128)/128)**2;return Math.min(1,Math.sqrt(energy/samples.length)*5.2);},
 stop(){speechSerial++;if(spoken){try{spoken.stop();}catch{}spoken=null;}window.speechSynthesis?.cancel();if(media&&ctx)media.volume.gain.setTargetAtTime(.48,ctx.currentTime,.12);},
 async say(text,speaker,{onStart=()=>{},onEnd=()=>{},onUnavailable=()=>{}}={}){
  this.stop();if(!voiceConfig.voices||voiceConfig.mute||voiceConfig.volume===0){onUnavailable();return;}
  const serial=speechSerial;
  if(ctx&&master&&ctx.state==='running'){
   const buffer=await loadVoice(text);if(serial!==speechSerial)return;
   if(buffer){
    if(!analyser){analyser=ctx.createAnalyser();analyser.fftSize=512;samples=new Uint8Array(analyser.fftSize);analyser.connect(master);}
    const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=buffer;source.playbackRate.value=slowRate;g.gain.value=.93;source.connect(g).connect(analyser);spoken=source;
    if(media)media.volume.gain.setTargetAtTime(.18,ctx.currentTime,.13);
    source.addEventListener('ended',()=>{source.disconnect();g.disconnect();if(serial===speechSerial&&spoken===source){spoken=null;if(media)media.volume.gain.setTargetAtTime(.48,ctx.currentTime,.25);onEnd();}},{once:true});
    source.start();onStart(buffer.duration/slowRate);return;
   }
  }
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){onUnavailable();return;}
  const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('pt'));if(!voice){onUnavailable();return;}
  const u=new SpeechSynthesisUtterance(text);u.lang='pt-BR';u.voice=voice;u.pitch=speaker==='Davi'?.83:1.04;u.rate=.95;u.volume=voiceConfig.volume/100;
  u.onstart=()=>{if(serial===speechSerial)onStart();};u.onend=()=>{if(serial===speechSerial)onEnd();};u.onerror=()=>{if(serial===speechSerial)onUnavailable();};speechSynthesis.speak(u);
 }
};
