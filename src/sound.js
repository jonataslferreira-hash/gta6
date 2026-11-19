import { stationPosition } from './radio-clock.js';
import { casinoVoices } from './casino-voices.js';
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
 {name:'Aero Mar',tag:'FRUTIGER AERO / RETRÔ',tracks:[['Underwater','SnugglyBun','underwater'],['Crystal Cave + Mysterious Ambience','Alex Smith / congusbongus','jewels'],['Worldmap Ice','SnugglyBun','worldmap_ice'],['Midday','SnugglyBun','midday']]},
 {name:'Rádio desligado',tag:'SÓ A CIDADE',tracks:[]},
];
const lengthsByName={chipdisko:158.45,glacier:86.15,jewels:86.41,midday:64,midday_alt:58.18,night:72.73,saharan_penguin:96,salcon:56,skylevel:81.45,sunset:104.73,tropicalbreeze:73.15,underwater:115.20,worldmap_ice:38.4};
const lengths=stations.map(station=>station.tracks.map(t=>lengthsByName[t[2]]??(128*60/originals[t[3]].bpm)));
const tuning=lengths.map(d=>Math.random()*d.reduce((a,b)=>a+b,0));const epoch=performance.now()/1000;
const radioTime=()=>performance.now()/1000-epoch;
const nowPlaying=()=>stationPosition(lengths[channel],radioTime()+tuning[channel]);
let channel=0,song=0,media,atmosphere,engineLayer,engineFilter,engineBed,slowRate=1;
let ctx, master, radioMix, music, engine, engineGain, noise, current=0, tick=0, next=0, timer, enabled=false, muted=false, gain=.65, suspended=false;
function ready(){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 if(!ctx){try{ctx=new AC();master=ctx.createGain();master.gain.value=muted?0:gain;master.connect(ctx.destination);radioMix=ctx.createGain();radioMix.connect(master);music=ctx.createGain();music.gain.value=.44;music.connect(radioMix);noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;engine=ctx.createOscillator();engine.type='sawtooth';const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=110;engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(f).connect(engineGain).connect(master);engine.start();}catch{return;}}
 if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 if(!engineFilter){engineFilter=ctx.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=115;engineLayer=ctx.createOscillator();engineLayer.type='triangle';engineLayer.connect(engineFilter).connect(engineGain);engineLayer.start();const road=ctx.createBufferSource();road.buffer=noise;road.loop=true;const tire=ctx.createBiquadFilter();tire.type='bandpass';tire.frequency.value=270;tire.Q.value=.25;engineBed=ctx.createGain();engineBed.gain.value=0;road.connect(tire).connect(engineBed).connect(master);road.start();}
 if(!atmosphere){const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noise;src.loop=true;f.type='lowpass';f.frequency.value=320;g.gain.value=0;src.connect(f).connect(g).connect(master);src.start();atmosphere={g,f};}
 if(!media){const audio=new Audio();audio.preload='none';audio.preservesPitch=false;audio.playbackRate=slowRate;const volume=ctx.createGain();volume.gain.value=.48;ctx.createMediaElementSource(audio).connect(volume).connect(radioMix);audio.addEventListener('ended',()=>tune());media={audio,volume,serial:0};}
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
function selectTrack(offset=0){
 stopLoop(); const track=stations[channel].tracks[song];if(media){media.audio.pause();media.serial++;}
 if(music)music.gain.setTargetAtTime(track&&Number.isInteger(track[3])?.44:0,ctx.currentTime,.12);
 if(!track||!enabled||suspended)return;
 if(track[2]&&media){
   const {audio}=media,serial=media.serial,url=`${import.meta.env.BASE_URL}radio/${track[2]}.mp3`;
   const setOffset=()=>{if(serial!==media.serial)return;if(Number.isFinite(audio.duration))audio.currentTime=Math.min(offset,Math.max(0,audio.duration-.18));};
   if(audio.getAttribute('src')!==url){audio.src=url;audio.addEventListener('loadedmetadata',setOffset,{once:true});}else if(audio.readyState>0)setOffset();else audio.addEventListener('loadedmetadata',setOffset,{once:true});
   audio.playbackRate=slowRate;audio.play().catch(()=>{});
 }else if(Number.isInteger(track[3])){current=track[3];tick=Math.floor(offset*originals[current].bpm/15)%512;startLoop();}
}
function tune(){const p=nowPlaying();song=p.index;selectTrack(p.offset);}
export const radio={ready,stations,start(n=0){ready();enabled=true;suspended=false;channel=n===4?2:0;tune();},
 slow(rate){slowRate=rate;if(media)media.audio.playbackRate=rate;if(spoken&&ctx&&!voicePaused)spoken.playbackRate.setTargetAtTime(rate,ctx.currentTime,.055);if(ctx&&timer)next=ctx.currentTime+.085;},
 stop(){this.slow(1);enabled=false;stopLoop();media?.audio.pause();this.motor(0,false);this.ambient(0,0);},
 pause(v){suspended=v;if(v){if(music)music.gain.setTargetAtTime(0,ctx.currentTime,.08);media?.audio.pause();stopLoop();this.motor(0,false);this.ambient(0,0);}else tune();},
 choose(n){ready();const station=(n+stations.length)%stations.length;if(station!==channel){channel=station;tune();}sfx('select');return this.info();},change(){return this.choose(channel+1);},
 skip(){const d=lengths[channel];if(d.length){const p=nowPlaying();tuning[channel]+=d[p.index]-p.offset+.06;tune();}return this.info();},
 info(){const [title='',artist='']=stations[channel].tracks[song]||[];return {station:stations[channel].name,title,artist,channel};},
 settings(c){gain=c.volume/100;muted=c.mute;if(master)master.gain.setTargetAtTime(muted?0:gain,ctx.currentTime,.04);},
 ambient(coast,t){if(!atmosphere)return;atmosphere.g.gain.setTargetAtTime(coast*(.03+.034*(Math.sin(t*.64)+1)),ctx.currentTime,.35);atmosphere.f.frequency.setTargetAtTime(290+80*Math.sin(t*.61),ctx.currentTime,.32);},
 motor(speed,active,rpm=null,load=0){if(!ctx||!engineGain)return;const v=Math.min(speed,27),t=ctx.currentTime,base=rpm?20+rpm/69:28+v*3.25;engine.frequency.setTargetAtTime(base,t,.08);engineLayer?.frequency.setTargetAtTime(base*1.43,t,.10);engineFilter?.frequency.setTargetAtTime(108+v*5.1+load*61,t,.12);engineBed?.gain.setTargetAtTime(active?v*.004:0,t,.14);engineGain.gain.setTargetAtTime(active?.037+v*.0021:0,t,.10);}};
export function sfx(kind){if(!ctx||!master||muted)return;const t=ctx.currentTime+.006;if(kind==='step'||kind==='sand'){const sand=kind==='sand';hit(t,sand?.148:.086,.06+Math.random()*.018,sand?1340:620+Math.random()*260,sand?'bandpass':'lowpass',master);tone(58+Math.random()*24,t,.09,sand?.020:.042,'sine',240,master,44);}if(kind==='door'){hit(t,.16,.19,380,'lowpass',master);tone(91,t,.13,.16,'triangle',260,master,41);}if(kind==='bump'){hit(t,.16,.13,650,'lowpass',master);}if(kind==='jump'){hit(t,.11,.06,1080,'bandpass',master);}if(kind==='chute'){hit(t,.35,.15,520,'lowpass',master);}if(kind==='swing'){hit(t,.13,.10,780,'lowpass',master);}if(kind==='pulse'){tone(480,t,.18,.13,'triangle',1770,master,90);}if(kind==='alarm'){[0,.34,.68].forEach(x=>tone(590,t+x,.21,.10,'sine',1900,master,720));}if(kind==='rattle'){hit(t,.10,.09,1300,'bandpass',master);hit(t+.053,.085,.07,800,'bandpass',master);}if(kind==='select'){tone(530,t,.115,.10,'triangle',1750,master);tone(795,t+.047,.14,.074,'sine',1750,master);}if(kind==='complete'){[60,64,67,72].forEach((n,i)=>tone(hz(n),t+i*.09,.45,.14,'triangle',2000,master));}}
// Miragem's score is separate from stations and follows the playable phase.
let scoreBus,windGain,windFilter,scorePhase='',scoreBeat=0,scoreNext=0,mixPaused=false;
function initHeistBus(){
 scoreBus=ctx.createGain();scoreBus.gain.value=0;scoreBus.connect(master);
 const wind=ctx.createBufferSource();wind.buffer=noise;wind.loop=true;
 windFilter=ctx.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=250;
 windGain=ctx.createGain();windGain.gain.value=0;wind.connect(windFilter).connect(windGain).connect(scoreBus);wind.start();
}
export const heistAudio={
 pause(paused){mixPaused=paused;if(scoreBus&&paused){scoreBus.gain.setTargetAtTime(0,ctx.currentTime,.05);scoreNext=0;}},
 update(phase,attention=0,canopy=false){
   if(!ctx||!radioMix)return;
   if(!scoreBus){if(!phase)return;initHeistBus();}
   const now=ctx.currentTime;
   if(phase!==scorePhase){
     scorePhase=phase;scoreBeat=0;scoreNext=now+.025;
     radioMix.gain.setTargetAtTime(phase?0:1,now,phase?.12:.57);
     if(phase==='alarm'){
       tone(88,now,.65,.22,'triangle',280,scoreBus,35);
       hit(now+.03,.23,.18,880,'bandpass',scoreBus);
     }
     if(phase==='air')tone(152,now,.62,.12,'triangle',380,scoreBus,45);
   }
   if(mixPaused)return;
   scoreBus.gain.setTargetAtTime(phase?.74:0,now,.13);
   windGain.gain.setTargetAtTime(phase==='air'?(canopy?.045:.20):0,now,.16);
   windFilter.frequency.setTargetAtTime(canopy?320:1200,now,.17);
   if(!phase||now+.032<scoreNext)return;
   const t=Math.max(now+.006,scoreNext), step=scoreBeat++, fast=phase==='escape', hush=phase==='alarm';
   scoreNext=t+(fast?.255:hush?.79:phase==='air'?.47:.48-.13*attention);
   if(phase==='air'){
     if(!canopy&&step%2===0)tone(69,t,.17,.11,'sine',180,scoreBus,35);
     if(canopy&&step%8===0)for(const n of [45,57,62,64])tone(hz(n),t,2.8,.037,'triangle',420,scoreBus);
     return;
   }
   const note=[38,38,41,37][Math.floor(step/8)%4];
   if(step%8===0||step%8===3||fast&&step%4===2)tone(83,t,.19,hush?.14:.20,'sine',240,scoreBus,37);
   if(!hush&&(step%4===0||fast&&step%4===3))tone(hz(note),t,fast?.19:.42,.11+attention*.045,'triangle',370,scoreBus);
   if(fast&&step%2===1)hit(t,.094,.102,1050,'bandpass',scoreBus);
   if(step%8===0)for(const n of [note+12,note+19,note+25])tone(hz(n),t,1.58,hush?.038:.056,'triangle',630,scoreBus);
 },
 stop(){this.pause(false);this.update('');}
};
let titleBuffer=null,titleClip=null,titleVersion=0;
export const titleCue={
 preload(){if(ctx&&!titleBuffer)titleBuffer=fetch(`${import.meta.env.BASE_URL}radio/worldmap_ice.mp3`).then(r=>{if(!r.ok)throw Error('offline');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b)).catch(()=>{titleBuffer=null;return null;});},
 async play(){this.preload();this.stop();const seq=titleVersion,b=await titleBuffer;if(!b||!ctx||seq!==titleVersion)return;
  const source=ctx.createBufferSource(),mix=ctx.createGain();source.buffer=b;source.connect(mix).connect(master);titleClip=source;
  const now=ctx.currentTime;mix.gain.setValueAtTime(0,now);mix.gain.linearRampToValueAtTime(.33,now+.23);mix.gain.setTargetAtTime(0,now+3.3,1.1);
  source.onended=()=>{source.disconnect();mix.disconnect();if(titleClip===source)titleClip=null;};source.start(now,.27,Math.min(6,b.duration-.27));
 },
 stop(){titleVersion++;if(titleClip){try{titleClip.stop();}catch{}titleClip=null;}}
};
let voiceConfig={voices:true, volume:65, mute:false}, spoken, spokenGain, speechSerial=0, analyser, samples, voicePaused=false, voiceOutput;
const voiceBuffers=new Map();
function loadVoice(text){
  const file=casinoVoices[text]||voiceLines[text];if(!file||!ctx)return null;
  if(!voiceBuffers.has(file))voiceBuffers.set(file,fetch(`${import.meta.env.BASE_URL}voices/${file}`).then(result=>{
    if(!result.ok)throw new Error('Offline voice');return result.arrayBuffer();
  }).then(data=>ctx.decodeAudioData(data)).catch(()=>{voiceBuffers.delete(file);return null;}));
  return voiceBuffers.get(file);
}
export const speech={
 settings(c){voiceConfig=c;if(c.mute||!c.voices)this.stop();},
 preload(text){loadVoice(text);},
 pause(v){
  voicePaused=v;if(ctx&&spoken)spoken.playbackRate.setValueAtTime(v?0:slowRate,ctx.currentTime);
  if(ctx&&voiceOutput)voiceOutput.gain.setTargetAtTime(v?0:1,ctx.currentTime,.025);
  if(v)window.speechSynthesis?.pause();else window.speechSynthesis?.resume();
 },
 range(volume){if(spokenGain&&ctx)spokenGain.gain.setTargetAtTime(.93*Math.max(0,Math.min(1,volume)),ctx.currentTime,.16);},
 level(){if(!spoken||!analyser)return 0;analyser.getByteTimeDomainData(samples);let energy=0;for(const x of samples)energy+=((x-128)/128)**2;return Math.min(1,Math.sqrt(energy/samples.length)*5.2);},
 stop(){speechSerial++;if(spoken){try{spoken.stop();}catch{}spoken=null;spokenGain=null;}window.speechSynthesis?.cancel();if(media&&ctx)media.volume.gain.setTargetAtTime(.48,ctx.currentTime,.12);},
 async say(text,speaker,{onStart=()=>{},onEnd=()=>{},onUnavailable=()=>{},volume=1}={}){
  this.stop();if(!voiceConfig.voices||voiceConfig.mute||voiceConfig.volume===0){onUnavailable();return;}
  const serial=speechSerial;
  if(ctx&&master&&ctx.state==='running'){
   const buffer=await loadVoice(text);if(serial!==speechSerial)return;
   if(buffer){
    if(!analyser){analyser=ctx.createAnalyser();analyser.fftSize=512;samples=new Uint8Array(analyser.fftSize);voiceOutput=ctx.createGain();voiceOutput.gain.value=voicePaused?0:1;analyser.connect(voiceOutput).connect(master);}
    const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=buffer;source.playbackRate.value=voicePaused?0:slowRate;g.gain.value=.93*Math.max(0,Math.min(1,volume));source.connect(g).connect(analyser);spoken=source;spokenGain=g;
    if(media)media.volume.gain.setTargetAtTime(.18,ctx.currentTime,.13);
    source.addEventListener('ended',()=>{source.disconnect();g.disconnect();if(serial===speechSerial&&spoken===source){spoken=null;spokenGain=null;if(media)media.volume.gain.setTargetAtTime(.48,ctx.currentTime,.25);onEnd();}},{once:true});
    source.start();onStart(buffer.duration/slowRate);return;
   }
  }
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){onUnavailable();return;}
  const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('pt'));if(!voice){onUnavailable();return;}
  const u=new SpeechSynthesisUtterance(text);u.lang='pt-BR';u.voice=voice;u.pitch=speaker==='Davi'?.83:1.04;u.rate=.95;u.volume=voiceConfig.volume/100*Math.max(0,Math.min(1,volume));
  u.onstart=()=>{if(serial===speechSerial)onStart();};u.onend=()=>{if(serial===speechSerial)onEnd();};u.onerror=()=>{if(serial===speechSerial)onUnavailable();};speechSynthesis.speak(u);if(voicePaused)speechSynthesis.pause();
 }
};
