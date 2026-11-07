// src/main.js
import { Game } from './game.js?v=10';
import { UI } from './ui.js?v=10';

const canvas = document.getElementById('game');
const game = new Game(canvas);
const ui = new UI(game);
game.setUI(ui);

// register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  });
}

// main loop
let last = performance.now();
function loop(now) {
  try {
    const rawDt = (now - last) / 1000;
    last = now;
    const dt = (isNaN(rawDt) || rawDt < 0) ? 0 : Math.min(rawDt, 0.1);
    game.update(dt);
  } catch (e) {
    console.error('Loop error', e);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// expose for debugging
window.game = game;
