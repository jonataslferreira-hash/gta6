import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800-italic.css';
import '@fontsource/barlow-condensed/latin-900-italic.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/space-mono/latin-400.css';
import './style.css';
import { radio, sfx, speech } from './sound.js';

import icon0 from "lucide-static/icons/play.svg?raw";
import icon1 from "lucide-static/icons/arrow-up-right.svg?raw";
import icon2 from "lucide-static/icons/compass.svg?raw";
import icon3 from "lucide-static/icons/map-pin.svg?raw";
import icon4 from "lucide-static/icons/chevron-left.svg?raw";
import icon5 from "lucide-static/icons/chevron-right.svg?raw";
import icon6 from "lucide-static/icons/keyboard.svg?raw";
import icon7 from "lucide-static/icons/x.svg?raw";
import icon8 from "lucide-static/icons/volume-x.svg?raw";
import icon9 from "lucide-static/icons/volume-2.svg?raw";
import icon10 from "lucide-static/icons/check.svg?raw";
import icon11 from "lucide-static/icons/settings.svg?raw";
import icon12 from "lucide-static/icons/log-out.svg?raw";
import icon13 from "lucide-static/icons/pause.svg?raw";
import icon14 from "lucide-static/icons/radio.svg?raw";
import icon15 from "lucide-static/icons/map.svg?raw";
import icon16 from "lucide-static/icons/navigation.svg?raw";
import icon17 from "lucide-static/icons/arrow-up.svg?raw";
import icon18 from "lucide-static/icons/arrow-down.svg?raw";
import icon19 from "lucide-static/icons/arrow-left.svg?raw";
import icon20 from "lucide-static/icons/arrow-right.svg?raw";
import icon21 from "lucide-static/icons/hand.svg?raw";
import icon22 from "lucide-static/icons/car.svg?raw";
const icons = {"play": icon0, "arrow-up-right": icon1, "compass": icon2, "map-pin": icon3, "chevron-left": icon4, "chevron-right": icon5, "keyboard": icon6, "x": icon7, "volume-x": icon8, "volume-2": icon9, "check": icon10, "settings": icon11, "log-out": icon12, "pause": icon13, "radio": icon14, "map": icon15, "navigation": icon16, "arrow-up": icon17, "arrow-down": icon18, "arrow-left": icon19, "arrow-right": icon20, "hand": icon21, "car": icon22};
const icon = name => (icons[name] || '').replace('<svg', '<svg aria-hidden="true"');
const slides = [
  { art:'vice-keyart', label:'MARÉ ALTA', district:'OCEAN BEACH', mode:'MODO HISTÓRIA', title:['MARÉ','ALTA'], kicker:'UM CONTO DE VICE CITY', copy:'Luzia voltou para Vice City com uma mala leve e uma promessa antiga. Mas nesta cidade, até o pôr do sol tem um preço.', button:'Iniciar história' },
  { art:'ocean-drive', label:'OCEAN DRIVE', district:'OCEAN DRIVE', mode:'MODO LIVRE', title:['OCEAN','DRIVE'], kicker:'EXPLORE VICE CITY', copy:'Pegue as chaves, escolha uma estação e siga pela orla. A cidade é sua para explorar, sem um destino marcado.', button:'Explorar a cidade' },
  { art:'after-dark', label:'DEPOIS DO SOL', district:'PORTO VIOLETA', mode:'MODO LIVRE', title:['DEPOIS','DO SOL'], kicker:'VICE CITY À NOITE', copy:'Quando a luz baixa, o Porto Violeta acende. Descubra as ruas da marina, os atalhos do cais e o outro lado da cidade.', button:'Explorar à noite' }
];
const defaults = { mute:false, volume:65, quality:matchMedia('(pointer: coarse)').matches?'low':'high', voices:true };
function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
let config = { ...defaults, ...load('mare-settings', {}) }, progress = load('mare-progress', null), selected = 0, game, busy = false;
const app = document.querySelector('#app');
app.innerHTML = `<main class="shell" id="menu">
  <div class="art-stack" aria-hidden="true">${slides.map((s,i) => `<div class="bg-art ${i===0?'active':''}" style="background-image:url('/art/${s.art}.jpg')"></div>`).join('')}</div>
  <div class="film" aria-hidden="true"></div>
  <header class="topbar">
    <button class="brand" id="home" aria-label="Vice City, início"><span class="brand-mark">VI</span><span class="brand-name">VICE CITY<small>MARÉ ALTA</small></span></button>
    <nav aria-label="Menu principal"><button id="campaign" class="nav active">Campanha</button><button id="explore" class="nav">Explorar</button><button id="options" class="nav">Ajustes</button></nav>
    <button id="sound" aria-label="Som" class="sound"></button>
  </header>
  <section class="hero" aria-labelledby="hero-title">
    <div class="chapter"><i></i><span id="chapter"></span></div>
    <p class="kicker" id="kicker"></p>
    <h1 class="title" id="hero-title"><span></span><em></em></h1>
    <p class="intro" id="intro"></p>
    <div class="actions"><button id="launch" class="primary">${icon('play')}<span></span>${icon('arrow-up-right')}</button><button id="secondary" class="secondary">${icon('compass')}<span>Explorar cidade</span></button></div>
  </section>
  <aside class="location">${icon('map-pin')}<div><strong id="district"></strong><span>VICE CITY, LEONIDA</span></div></aside>
  <section class="reel" aria-label="Cenas de Vice City">
    <div class="reel-head"><span><b>◆</b> POSTAIS DA CIDADE</span><div><button id="prev" class="reel-arrow" aria-label="Cena anterior">${icon('chevron-left')}</button><button id="next" class="reel-arrow" aria-label="Próxima cena">${icon('chevron-right')}</button></div></div>
    <div class="cards">${slides.map((s,i)=>`<button class="card" data-slide="${i}" aria-label="${s.label}"><img src="/art/${s.art}.jpg" alt=""><span class="card-num">0${i+1}</span><span class="card-label">${s.label}</span></button>`).join('')}</div>
    <div class="reel-index"><strong id="slide-num">01</strong><span class="track"><i></i></span><span>03</span></div>
  </section>
  <footer class="footer"><div class="footer-status"><i></i> <strong>VICE CITY</strong><span></span> LEONIDA, EUA</div><div class="footer-tag">O PARAÍSO TEM UM PREÇO<span>.</span></div><button id="guide">${icon('keyboard')} <span>CONTROLES</span></button></footer>
</main>
<div id="playfield" hidden></div>
<dialog id="dialog"><div class="dialog-top"><span id="dialog-eyebrow">VICE CITY / MENU</span><button class="reel-arrow" id="close-dialog" aria-label="Fechar">${icon('x')}</button></div><h2 id="dialog-title"></h2><div id="dialog-body"></div></dialog>`;
const $ = selector => document.querySelector(selector);
const dialog = $('#dialog');
function update(i, animate=true) {
  if(i===selected && animate) return;
  selected = i; const s = slides[i];
  document.querySelectorAll('.bg-art, .card').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.bg-art')[i].classList.add('active');
  document.querySelectorAll('.card').forEach((el,j)=>{ el.classList.toggle('active',i===j); el.setAttribute('aria-pressed', String(i===j)); });
  $('#campaign').classList.toggle('active', i===0); $('#explore').classList.toggle('active', i!==0);
  $('#chapter').textContent = i===0 ? 'CAPÍTULO 01  /  MODO HISTÓRIA' : `${s.mode}  /  0${i+1}`;
  $('#kicker').textContent = s.kicker;
  $('.title span').textContent = s.title[0]; $('.title em').textContent = s.title[1];
  $('#intro').textContent = s.copy; $('#district').textContent = s.district;
  $('#launch span').textContent = i===0 && (progress?.stage>0||progress?.introSeen) ? 'Continuar história' : s.button;
  $('#secondary').hidden = i!==0; $('#slide-num').textContent = `0${i+1}`;
  $('.track i').style.transform = `translateX(${i*100}%)`;
  if(animate) $('.hero').animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}], {duration:310,easing:'ease-out'});
}
function apply() {
  save('mare-settings', config); radio.settings(config); speech.settings(config); game?.settings(config);
  $('#sound').innerHTML = `${icon(config.mute?'volume-x':'volume-2')}<span>${config.mute?'ÁUDIO OFF':'ÁUDIO ON'}</span>`;
  $('#sound').setAttribute('aria-pressed', String(!config.mute));
}
function show(title, body, eyebrow='VICE CITY / MENU') {
  $('#dialog-eyebrow').textContent = eyebrow; $('#dialog-title').textContent = title; $('#dialog-body').innerHTML = body;
  if(!dialog.open) dialog.showModal();
}
function settings() {
  show('Ajustes', `<label class="setting"><span>Qualidade gráfica<small>Alto tem sombras mais nítidas, sem aumentar a exposição.</small></span><select id="quality"><option value="high">Alto</option><option value="low">Leve</option></select></label><label class="setting"><span>Volume geral</span><input id="volume" type="range" min="0" max="100" value="${config.volume}"></label><label class="setting"><span>Dublagem do navegador<small>A voz depende das opções instaladas no aparelho.</small></span><input id="voices" type="checkbox" ${config.voices?'checked':''}></label><button class="primary compact" id="done">Concluir ${icon('check')}</button>`);
  $('#quality').value = config.quality;
  $('#quality').onchange = e=>{config.quality=e.target.value;apply();};
  $('#volume').oninput = e=>{config.volume=+e.target.value;config.mute=false;apply();};
  $('#voices').onchange = e=>{config.voices=e.target.checked;apply();};
  $('#done').onclick=()=>dialog.close();
}
const help = `<dl class="keys"><div><dt>Andar / dirigir</dt><dd>W A S D / ↑ ← ↓ →</dd></div><div><dt>Correr / freio de mão</dt><dd>SHIFT / ESPAÇO</dd></div><div><dt>Interagir / entrar no carro</dt><dd>E</dd></div><div><dt>Trocar estação</dt><dd>R</dd></div><div><dt>Mapa / pausa</dt><dd>M / ESC</dd></div><div><dt>Girar a câmera</dt><dd>Arraste o cenário</dd></div></dl><p class="hint">No celular, os controles aparecem automaticamente na tela.</p>`;
function pause() {
  if(dialog.open) { dialog.close(); return; }
  game?.pause(true);
  show('Em pausa', `<div class="pause-actions"><button class="primary compact" id="resume">Voltar ao jogo ${icon('play')}</button><button class="secondary" id="in-options">${icon('settings')} Ajustes</button><button class="secondary" id="in-guide">${icon('keyboard')} Controles</button><button class="secondary" id="quit">${icon('log-out')} Menu principal</button></div>`,'VICE CITY / PAUSA');
  $('#resume').onclick=()=>dialog.close(); $('#in-options').onclick=settings; $('#in-guide').onclick=()=>show('Controles',help);
  $('#quit').onclick=()=>{game.destroy();game=null;dialog.close();$('#playfield').hidden=true;$('#menu').hidden=false;radio.stop();update(selected,false);};
}
async function launch() {
  if(busy || game) return;
  busy=true; $('#launch span').textContent='Carregando…';
  try {
    const { startGame } = await import('./game.js');
    $('#playfield').hidden=false;
    game=startGame($('#playfield'), { mode:selected, config, progress, icon, onPause:pause, onSave:p=>{progress=p;save('mare-progress',p);} });
    $('#menu').hidden=true;
  } catch (error) {
    console.error(error); $('#playfield').hidden=true;
    show('Não deu para abrir a cidade', '<p class="hint">O jogo 3D precisa de WebGL. Verifique se a aceleração gráfica está ligada ou tente outro navegador.</p>');
  } finally {busy=false;update(selected,false);}
}
$('#home').onclick=()=>update(0); $('#campaign').onclick=()=>update(0); $('#explore').onclick=()=>update(1);
$('#options').onclick=settings; $('#guide').onclick=()=>show('Controles',help);
$('#prev').onclick=()=>update((selected+2)%3); $('#next').onclick=()=>update((selected+1)%3);
document.querySelectorAll('.card').forEach(el=>el.onclick=()=>update(+el.dataset.slide));
$('#launch').onclick=()=>{radio.ready();sfx('select');launch();}; $('#secondary').onclick=()=>{update(1);radio.ready();sfx('select');launch();};
$('#sound').onclick=()=>{config.mute=!config.mute;radio.ready();apply(); if(!config.mute)sfx('select');};
$('#close-dialog').onclick=()=>dialog.close(); dialog.addEventListener('close',()=>game?.pause(false));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
window.addEventListener('keydown',e=>{if(game||dialog.open||busy||e.defaultPrevented)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();update((selected+(e.key==='ArrowLeft'?2:1))%3);}});
update(0,false); apply();
