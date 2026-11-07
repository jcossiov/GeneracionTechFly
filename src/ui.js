import { loadScores, clearScores, saveSettings as saveSettingsStorage, loadPlayerName, savePlayerName } from './storage.js?v=11';
import { saveBindings as saveBindingsStorage, loadBindings } from './storage.js?v=11';
import { DEFAULT_BINDINGS } from './config.js?v=11';
function keyLabel(code) {
  const map = {
    Space: 'Espacio', Escape: 'Esc', Enter: 'Enter',
    ShiftLeft: 'Shift Izq', ShiftRight: 'Shift Der',
    ControlLeft: 'Ctrl Izq', ControlRight: 'Ctrl Der',
    AltLeft: 'Alt Izq', AltRight: 'Alt Der',
    Tab: 'Tab', Backspace: 'Borrar', Delete: 'Supr',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Arrow')) return code.slice(5);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  return code;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export class UI {
  constructor(game) {
    this.game = game;
    this.menuOverlay = document.getElementById('menuOverlay');
    this.controlsOverlay = document.getElementById('controlsOverlay');
    this.settingsOverlay = document.getElementById('settingsOverlay');
    this.scoresOverlay = document.getElementById('scoresOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameoverOverlay = document.getElementById('gameoverOverlay');
    this.levelOverlay = document.getElementById('levelOverlay');
    this.hud = document.getElementById('hud');
    this.toastEl = document.getElementById('toast');
    this._toastTimer = null;
    this._levelCallback = null;

    // buttons
    document.getElementById('btnArcade').addEventListener('click', () => { 
      const v = (document.getElementById('playerName').value || '').trim() || 'Piloto';
      game.playerName = v; savePlayerName(v);
      game.audio.ui(); game.startMode('arcade'); this.hideAllOverlays(); 
    });
    document.getElementById('btnLevels').addEventListener('click', () => { 
      const v = (document.getElementById('playerName').value || '').trim() || 'Piloto';
      game.playerName = v; savePlayerName(v);
      game.audio.ui(); game.startMode('levels'); this.hideAllOverlays(); 
    });
    document.getElementById('btnControls').addEventListener('click', () => { game.audio.ui(); this.show('controls'); });
    document.getElementById('btnScores').addEventListener('click', () => { game.audio.ui(); this.refreshScores(); this.show('scores'); });
    document.getElementById('btnSettings').addEventListener('click', () => { game.audio.ui(); this.show('settings'); });
    document.getElementById('btnBackFromControls').addEventListener('click', () => this.show('menu'));
    document.getElementById('btnBackFromSettings').addEventListener('click', () => { this.saveSettings(); this.show('menu'); });
    document.getElementById('btnBackFromScores').addEventListener('click', () => this.show('menu'));
    document.getElementById('btnClearScores').addEventListener('click', () => { clearScores(); this.refreshScores(); });
    document.getElementById('btnResume').addEventListener('click', () => { game.resume(); });
    document.getElementById('btnQuit').addEventListener('click', () => { game.state='menu'; game.audio.stopMusic(); this.showHUD(false); this.show('menu'); });
    document.getElementById('btnRetry').addEventListener('click', () => { game.audio.ui(); const m = game.levelManager.mode; game.startMode(m); this.hideAllOverlays(); });
    document.getElementById('btnMenu').addEventListener('click', () => { game.state='menu'; this.showHUD(false); this.show('menu'); });

    // settings inputs
    const ms = document.getElementById('musicVol');
    const ss = document.getElementById('sfxVol');
    const mouses = document.getElementById('mouseSens');
    ms.value = game.settings.musicVol;
    ss.value = game.settings.sfxVol;
    mouses.value = game.settings.mouseSens;
    document.getElementById('showFps').checked = game.settings.showFps;
    document.getElementById('vibrate').checked = game.settings.vibrate;
    ms.addEventListener('input', () => { game.settings.musicVol = parseFloat(ms.value); game.audio.setMusicVolume(game.settings.musicVol); });
    ss.addEventListener('input', () => { game.settings.sfxVol = parseFloat(ss.value); game.audio.setSfxVolume(game.settings.sfxVol); });
    const nameInput = document.getElementById('playerName');
    if (nameInput) {
      nameInput.value = game.playerName || loadPlayerName() || '';
      nameInput.addEventListener('input', () => {
        const v = nameInput.value.trim() || 'Piloto';
        game.playerName = v;
        savePlayerName(v);
      });
    }

    const restoreBtn = document.getElementById('btnRestoreBindings');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        this.game.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
        this.game.input.setBindings(this.game.bindings);
        saveBindingsStorage(this.game.bindings);
        this.renderBindings();
      });
    }
    this.renderBindings();
  }

  show(name) {
    this.hideAllOverlays();
    if (name === 'menu') this.menuOverlay.classList.remove('hidden');
    else if (name === 'controls') this.controlsOverlay.classList.remove('hidden');
    if (name === 'settings') { this.settingsOverlay.classList.remove('hidden'); this.renderBindings(); }
    else if (name === 'scores') this.scoresOverlay.classList.remove('hidden');
  }

  hideAllOverlays() {
    for (const el of [this.menuOverlay,this.controlsOverlay,this.settingsOverlay,this.scoresOverlay,this.pauseOverlay,this.gameoverOverlay,this.levelOverlay]) {
      el.classList.add('hidden');
    }
  }

  showHUD(v) {
    this.hud.style.display = v ? 'flex' : 'none';
    const tc = document.getElementById('touchControls');
    if (v) tc.classList.remove('hidden'); else tc.classList.add('hidden');
  }

  showPause(v) {
    if (v) this.pauseOverlay.classList.remove('hidden'); else this.pauseOverlay.classList.add('hidden');
  }

  showGameOver(score, level, time) {
    document.getElementById('goTitle').textContent = 'Game Over';
    document.getElementById('goText').textContent = `Puntuación: ${score}  |  Nivel: ${level}  |  Tiempo: ${Math.floor(time)}s`;
    this.gameoverOverlay.classList.remove('hidden');
    this.showHUD(false);
  }

  showLevelSplash(lvl, cb) {
    this._levelCallback = cb;
    document.getElementById('levelTitle').textContent = `Nivel ${lvl}`;
    document.getElementById('levelText').textContent = lvl === 1 ? 'Prepárate para el despegue.' : 'Dificultad aumentada. ¡Suerte!';
    this.levelOverlay.classList.remove('hidden');
    this.showHUD(false);
    setTimeout(() => {
      this.levelOverlay.classList.add('hidden');
      this.showHUD(true);
      if (this._levelCallback) { this._levelCallback(); this._levelCallback = null; }
    }, 1200);
  }

  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 1400);
  }

  renderBindings() {
    const container = document.getElementById('bindingsList');
    if (!container) return;
    container.innerHTML = '';
    const labels = {
      moveUp: 'Mover arriba',
      moveDown: 'Mover abajo',
      moveLeft: 'Mover izquierda',
      moveRight: 'Mover derecha',
      fire: 'Disparar',
      boost: 'Boost',
      pause: 'Pausar',
    };
    const bindings = this.game.bindings || DEFAULT_BINDINGS;
    for (const action of Object.keys(labels)) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      const label = document.createElement('span');
      label.textContent = labels[action];
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.minWidth = '180px';
      btn.style.padding = '6px 12px';
      btn.style.fontSize = '14px';
      const keys = bindings[action] || [];
      btn.textContent = keys.map(k => keyLabel(k)).join(', ') || '—';
      btn.addEventListener('click', () => this.startRemap(action, btn));
      row.appendChild(label);
      row.appendChild(btn);
      container.appendChild(row);
    }
  }

  startRemap(action, btn) {
    btn.textContent = 'Presiona una tecla...';
    const handler = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.code) return;
      if (!this.game.bindings) this.game.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
      this.game.bindings[action] = [e.code];
      this.game.input.setBindings(this.game.bindings);
      saveBindingsStorage(this.game.bindings);
      window.removeEventListener('keydown', handler, true);
      this.renderBindings();
    };
    window.addEventListener('keydown', handler, true);
  }
  updateHUD(game) {
    document.getElementById('hpBar').style.width = (game.player.hp/game.player.maxHp*100) + '%';
    document.getElementById('shieldBar').style.width = (game.player.shield/game.player.maxShield*100) + '%';
    document.getElementById('score').textContent = Math.floor(game.score);
    document.getElementById('level').textContent = game.levelManager.level;
    document.getElementById('wave').textContent = game.levelManager.mode==='levels' ? game.levelManager.wave : '∞';
    const diffEl = document.getElementById('diff');
    if (diffEl) diffEl.textContent = Math.round(game.levelManager.difficulty * 100);
    document.getElementById('time').textContent = Math.floor(game.time);
    const pu = [];
    if (game.player.shield > 0) pu.push('Escudo');
    if (game.player.weapon >= 2) pu.push(game.player.weapon===3?'Triple':'Doble');
    if (game.player.boostTimer > 0) pu.push('Boost');
    document.getElementById('powerups').textContent = pu.join(' · ');
    const fpsEl = document.getElementById('fps');
    if (fpsEl) fpsEl.textContent = game.settings.showFps ? `FPS: ${game.fps.toFixed(0)}` : '';
  }

  refreshScores() {
    const arr = loadScores();
    const el = document.getElementById('scoreboard');
    const arcade = arr.filter(e=>e.mode==='arcade').sort((a,b)=>b.score-a.score).slice(0,10);
    const levels = arr.filter(e=>e.mode==='levels').sort((a,b)=> (b.level-a.level) || (b.score-a.score)).slice(0,10);
    let html = '<h3 style="color:var(--accent)">Arcade — Mejor puntuación</h3>';
    if (!arcade.length) html += '<p>Sin puntuaciones.</p>';
    else {
      html += '<table><tr><th>#</th><th>Nombre</th><th>Puntos</th><th>Tiempo</th></tr>';
      arcade.forEach((e,i) => { html += `<tr><td>${i+1}</td><td>${escapeHtml(e.name||'Piloto')}</td><td>${e.score}</td><td>${e.time}s</td></tr>`; });
      html += '</table>';
    }
    html += '<h3 style="color:var(--accent); margin-top:12px">Niveles — Nivel máximo alcanzado</h3>';
    if (!levels.length) html += '<p>Sin puntuaciones.</p>';
    else {
      html += '<table><tr><th>#</th><th>Nombre</th><th>Nivel</th><th>Puntos</th><th>Tiempo</th></tr>';
      levels.forEach((e,i) => { html += `<tr><td>${i+1}</td><td>${escapeHtml(e.name||'Piloto')}</td><td>${e.level}</td><td>${e.score}</td><td>${e.time}s</td></tr>`; });
      html += '</table>';
    }
    el.innerHTML = html;
  }

  saveSettings() {
    const s = this.game.settings;
    s.showFps = document.getElementById('showFps').checked;
    s.vibrate = document.getElementById('vibrate').checked;
    saveSettingsStorage(s);
    saveBindingsStorage(this.game.bindings);
    this.game.input.setMouseSens(s.mouseSens);
  }
}

// helper imports via global to avoid circular; set in main
let clearScoresImport = () => {};
let loadScoresImport = () => [];
let saveSettingsImport = () => {};
export function bindStorage(fns) {
  clearScoresImport = fns.clearScores;
  loadScoresImport = fns.loadScores;
  saveSettingsImport = fns.saveSettings;
  // patch refreshScores
}
