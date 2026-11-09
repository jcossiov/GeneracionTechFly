// src/main.js
import { Game } from './game.js?v=13';
import { UI } from './ui.js?v=13';

const canvas = document.getElementById('game');
const game = new Game(canvas);
const ui = new UI(game);
game.setUI(ui);

window.addEventListener('resize', () => game.onResize());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(reg => reg.update()).catch(() => {});
  });
}

let last = performance.now();
function loop(now) {
  try {
    const rawDt = (now - last) / 1000;
    last = now;
    const dt = isNaN(rawDt) || rawDt < 0 ? 0 : Math.min(rawDt, 0.1);
    game.update(dt);
  } catch (e) {
    console.error('Loop error', e);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.game = game;
