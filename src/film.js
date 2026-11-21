import { createScreening,screeningDuration,afterHoursLines,streetScenes } from './screening-scenes.js';
import { speech } from './sound.js';

// Runs on the gameplay frame loop, with a directed camera in the same city scene.
export function makeFilm(host,{scene,cast,onStart,onEnd}){
  const overlay=document.createElement('section');
  overlay.className='street-film';overlay.hidden=true;
  overlay.innerHTML=`<div class="street-film-fade" aria-hidden="true"></div><div class="street-film-bars" aria-hidden="true"></div>
    <div class="street-film-place"><small></small><strong></strong></div>
    <button type="button" class="secondary">Pular cena</button>
    <div class="film-caption" aria-live="polite" hidden><b></b><p></p></div>`;
  host.append(overlay);
  const caption=overlay.querySelector('.film-caption'),fade=overlay.querySelector('.street-film-fade'),place=overlay.querySelector('.street-film-place');
  let active;
  function finish(completed){
    if(!active)return;
    const s=active;active=null;s.set.dispose();speech.stop();overlay.hidden=true;
    host.classList.remove('cinematic','street-cinematic');delete host.dataset.streetScene;delete host.dataset.shot;
    onEnd();if(completed)s.done?.();
  }
  overlay.querySelector('button').onclick=()=>finish(true);
  return {
    get active(){return Boolean(active);},skip(){finish(true);},destroy(){finish(false);overlay.remove();},
    start(kind,outfit,lines=afterHoursLines,done){
      if(active)return false;
      const set=createScreening(kind,cast,outfit,scene),site=streetScenes[kind];
      active={set,kind,lines,done,t:0,i:0,speaker:'',times:kind==='kiosk'?[1.88,11.34]:[1.52,6.43],lastCaption:kind==='kiosk'?18.46:11.12};
      onStart(kind);host.classList.add('cinematic','street-cinematic');host.dataset.streetScene=kind;
      place.hidden=false;place.querySelector('small').textContent=site.place;place.querySelector('strong').textContent=site.title;
      overlay.setAttribute('aria-label',`Cutscene: ${site.title}`);caption.hidden=true;overlay.hidden=false;fade.style.opacity='1';
      return true;
    },
    frame(dt,aspect){
      if(!active)return null;
      const s=active,t=s.t;s.t+=dt;
      if(t>=screeningDuration[s.kind]){finish(true);return null;}
      if(s.i<s.lines.length&&t>=s.times[s.i]){
        const [name,line]=s.lines[s.i++];s.speaker=name;caption.hidden=false;
        caption.querySelector('b').textContent=name;caption.querySelector('p').textContent=line;
        speech.say(line,name,{onEnd:()=>{if(active===s&&s.speaker===name)s.speaker='';}});
      }
      if(t>s.lastCaption){caption.hidden=true;s.speaker='';}
      place.hidden=t>2.8;
      fade.style.opacity=String(Math.max(1-t/.34,s.set.act(t,Math.min(dt,.12),s.speaker,speech.level())));
      host.dataset.shot=s.set.frame(t,aspect);return s.set.camera;
    },
  };
}
