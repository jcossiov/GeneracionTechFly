// src/ui.js
import {
  loadScores,
  clearScores,
  saveSettings as saveSettingsStorage,
  loadPlayerName,
  savePlayerName,
  saveBindings as saveBindingsStorage,
} from './storage.js?v=13';
import { DEFAULT_BINDINGS } from './config.js?v=13';
import { getStageForLevel } from './curriculum.js?v=13';

function keyLabel(code) {
  const map = {
    Space: 'Espacio',
    Escape: 'Esc',
    Enter: 'Enter',
    ShiftLeft: 'Shift Izq',
    ShiftRight: 'Shift Der',
    ControlLeft: 'Ctrl Izq',
    ControlRight: 'Ctrl Der',
    AltLeft: 'Alt Izq',
    AltRight: 'Alt Der',
    Tab: 'Tab',
    Backspace: 'Borrar',
    Delete: 'Supr',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Arrow')) return code.slice(5);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  return code;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
    this.levelSelectOverlay = document.getElementById('levelSelectOverlay');
    this.hud = document.getElementById('hud');
    this.toastEl = document.getElementById('toast');
    this.questionBanner = document.getElementById('questionBanner');
    this.optionsPreview = document.getElementById('optionsPreview');
    this.bossHud = document.getElementById('bossHud');
    this._toastTimer = null;
    this._levelCallback = null;

    // Botones del Menú
    document.getElementById('btnArcade').addEventListener('click', () => {
      const v = (document.getElementById('playerName').value || '').trim() || 'Piloto Tech';
      game.playerName = v;
      savePlayerName(v);
      game.audio.ui();
      this.hideAllOverlays();
      game.startMode('arcade');
    });

    document.getElementById('btnLevels').addEventListener('click', () => {
      game.audio.ui();
      this.show('levelSelect');
    });

    const btnQuickStart = document.getElementById('btnQuickStart');
    if (btnQuickStart) {
      btnQuickStart.addEventListener('click', () => {
        const v = (document.getElementById('playerName').value || '').trim() || 'Piloto Tech';
        game.playerName = v;
        savePlayerName(v);
        game.audio.ui();
        this.hideAllOverlays();
        game.startMode('levels', 1);
      });
    }

    const btnBackLvl = document.getElementById('btnBackFromLevelSelect');
    if (btnBackLvl) {
      btnBackLvl.addEventListener('click', () => {
        game.audio.ui();
        this.show('menu');
      });
    }

    document.querySelectorAll('.lvl-start-btn, .level-card-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = btn.classList.contains('level-card-btn') ? btn : btn.closest('.level-card-btn');
        const lvl = parseInt(card?.dataset.level || btn.dataset.level || '1');
        const v = (document.getElementById('playerName').value || '').trim() || 'Piloto Tech';
        game.playerName = v;
        savePlayerName(v);
        game.audio.ui();
        this.hideAllOverlays();
        game.startMode('levels', lvl);
      });
    });

    const btnChangeLevel = document.getElementById('btnChangeLevel');
    if (btnChangeLevel) {
      btnChangeLevel.addEventListener('click', () => {
        game.audio.ui();
        this.show('levelSelect');
      });
    }

    document.getElementById('btnControls').addEventListener('click', () => {
      game.audio.ui();
      this.show('controls');
    });
    document.getElementById('btnScores').addEventListener('click', () => {
      game.audio.ui();
      this.refreshScores();
      this.show('scores');
    });
    document.getElementById('btnSettings').addEventListener('click', () => {
      game.audio.ui();
      this.show('settings');
    });
    document.getElementById('btnBackFromControls').addEventListener('click', () => this.show('menu'));
    document.getElementById('btnBackFromSettings').addEventListener('click', () => {
      this.saveSettings();
      this.show('menu');
    });
    document.getElementById('btnBackFromScores').addEventListener('click', () => this.show('menu'));
    document.getElementById('btnClearScores').addEventListener('click', () => {
      clearScores();
      this.refreshScores();
    });
    document.getElementById('btnResume').addEventListener('click', () => {
      game.resume();
    });
    document.getElementById('btnQuit').addEventListener('click', () => {
      game.state = 'menu';
      game.audio.stopMusic();
      this.hideQuestionBanner();
      this.showHUD(false);
      this.show('menu');
    });
    document.getElementById('btnRetry').addEventListener('click', () => {
      game.audio.ui();
      const m = game.levelManager.mode;
      const lvl = game.levelManager.level;
      this.hideAllOverlays();
      game.startMode(m, lvl);
    });
    document.getElementById('btnMenu').addEventListener('click', () => {
      game.state = 'menu';
      this.hideQuestionBanner();
      this.showHUD(false);
      this.show('menu');
    });

    const pauseHudBtn = document.getElementById('btnPauseHud');
    if (pauseHudBtn) {
      pauseHudBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (game.state === 'playing') game.pause();
      });
    }

    // Inputs de Ajustes
    const ms = document.getElementById('musicVol');
    const ss = document.getElementById('sfxVol');
    const mouses = document.getElementById('mouseSens');
    ms.value = game.settings.musicVol;
    ss.value = game.settings.sfxVol;
    mouses.value = game.settings.mouseSens;
    document.getElementById('showFps').checked = game.settings.showFps;
    document.getElementById('vibrate').checked = game.settings.vibrate;

    ms.addEventListener('input', () => {
      game.settings.musicVol = parseFloat(ms.value);
      game.audio.setMusicVolume(game.settings.musicVol);
    });
    ss.addEventListener('input', () => {
      game.settings.sfxVol = parseFloat(ss.value);
      game.audio.setSfxVolume(game.settings.sfxVol);
    });
    mouses.addEventListener('input', () => {
      game.settings.mouseSens = parseFloat(mouses.value);
    });

    const nameInput = document.getElementById('playerName');
    if (nameInput) {
      nameInput.value = game.playerName || loadPlayerName() || '';
      nameInput.addEventListener('input', () => {
        const v = nameInput.value.trim() || 'Piloto Tech';
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
    else if (name === 'settings') {
      this.settingsOverlay.classList.remove('hidden');
      this.renderBindings();
    } else if (name === 'scores') this.scoresOverlay.classList.remove('hidden');
    else if (name === 'levelSelect') {
      if (this.levelSelectOverlay) this.levelSelectOverlay.classList.remove('hidden');
    }
  }

  hideAllOverlays() {
    for (const el of [
      this.menuOverlay,
      this.controlsOverlay,
      this.settingsOverlay,
      this.scoresOverlay,
      this.pauseOverlay,
      this.gameoverOverlay,
      this.levelOverlay,
      this.levelSelectOverlay,
    ]) {
      if (el) el.classList.add('hidden');
    }
  }

  showHUD(v) {
    this.hud.style.display = v ? 'flex' : 'none';
    const tc = document.getElementById('touchControls');
    if (v) tc.classList.remove('hidden');
    else {
      tc.classList.add('hidden');
      if (this.bossHud) this.bossHud.classList.add('hidden');
    }
  }

  // Muestra la Tarjeta de Pregunta (Paso 1) y luego las Opciones Desplegadas (Paso 2)
  showQuestionBanner(challenge, phase = 'question_card') {
    if (!this.questionBanner) return;
    const tag = document.getElementById('questionTag');
    const txt = document.getElementById('questionText');
    const sub = document.getElementById('questionSub');

    if (txt) txt.textContent = challenge.question;

    if (phase === 'question_card') {
      this.questionBanner.classList.remove('options-mode');
      if (tag) tag.textContent = `🃏 TARJETA DE PREGUNTA (${challenge.stage?.moduleName || 'Gen Tech'})`;
      if (sub) sub.textContent = '✈️ ¡Pasa con tu avión por la TARJETA DORADA si sabes la respuesta para ver las opciones!';
      if (this.optionsPreview) {
        this.optionsPreview.innerHTML = '';
        this.optionsPreview.classList.add('hidden');
      }
    } else {
      this.questionBanner.classList.add('options-mode');
      if (tag) tag.textContent = `⚡ ¡OPCIONES DESPLEGADAS! — RECOMPENSA: ${challenge.rewardLabel}`;
      if (sub) sub.textContent = '🎯 Vuela hacia la TARJETA con la respuesta correcta al frente:';
      if (this.optionsPreview) {
        const letters = ['A', 'B', 'C', 'D'];
        this.optionsPreview.innerHTML = challenge.options
          .map((opt, idx) => `<div class="opt-pill"><span>Tarjeta ${letters[idx]}:</span>${escapeHtml(opt.text)}</div>`)
          .join('');
        this.optionsPreview.classList.remove('hidden');
      }
    }

    this.questionBanner.classList.remove('hidden');
  }

  hideQuestionBanner() {
    if (this.questionBanner) this.questionBanner.classList.add('hidden');
  }

  showPause(v) {
    if (v) this.pauseOverlay.classList.remove('hidden');
    else this.pauseOverlay.classList.add('hidden');
  }

  showGameOver(score, level, time) {
    const stage = getStageForLevel(level);
    document.getElementById('goTitle').textContent = 'Misión Finalizada';
    document.getElementById('goText').textContent = `Piloto: ${this.game.playerName}  |  Llegaste a ${stage.lifeStage} (${stage.moduleName})  |  Puntos: ${score}  |  Tiempo: ${Math.floor(time)}s`;
    this.gameoverOverlay.classList.remove('hidden');
    this.showHUD(false);
  }

  showLevelSplash(lvl, stage, cb) {
    this._levelCallback = cb;
    const pill = document.getElementById('levelStagePill');
    if (pill) pill.textContent = `MÓDULO GENERACIÓN TECH: ${stage.moduleName.toUpperCase()}`;
    document.getElementById('levelTitle').textContent = stage.lifeStage;
    document.getElementById('levelText').textContent = `${stage.subtitle} — Villano del nivel: ${stage.bossName}`;
    this.levelOverlay.classList.remove('hidden');
    this.showHUD(false);
    setTimeout(() => {
      this.levelOverlay.classList.add('hidden');
      this.showHUD(true);
      if (this._levelCallback) {
        const fn = this._levelCallback;
        this._levelCallback = null;
        fn();
      }
    }, 2200);
  }

  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 2500);
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
      boost: 'Turbo (Boost)',
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
      btn.style.minWidth = '175px';
      btn.style.padding = '5px 10px';
      btn.style.fontSize = '13px';
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
    const handler = e => {
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

  updateHUD(game, stage) {
    document.getElementById('hpBar').style.width = (game.player.hp / game.player.maxHp) * 100 + '%';
    document.getElementById('shieldBar').style.width = (game.player.shield / game.player.maxShield) * 100 + '%';
    document.getElementById('score').textContent = Math.floor(game.score);
    document.getElementById('level').textContent = game.levelManager.level;
    document.getElementById('wave').textContent = game.levelManager.mode === 'levels' ? `${game.levelManager.wave}/2` : '∞';

    if (stage) {
      const sb = document.getElementById('stageBadge');
      const mb = document.getElementById('moduleBadge');
      if (sb) {
        sb.textContent = stage.lifeStage.toUpperCase();
        sb.style.color = stage.accentHex || '#00f5d4';
      }
      if (mb) mb.textContent = `Ruta: ${stage.moduleName}`;
    }

    const speedKmh = Math.round(game.worldSpeed * 38 * (game.player.boostTimer > 0 ? 1.3 : 1));
    const spdEl = document.getElementById('speedVal');
    if (spdEl) spdEl.textContent = speedKmh;

    const strEl = document.getElementById('streakVal');
    if (strEl) strEl.textContent = `x${game.techStreak}`;

    const diffEl = document.getElementById('diff');
    if (diffEl) diffEl.textContent = Math.round(game.levelManager.difficulty * 100);
    document.getElementById('time').textContent = Math.floor(game.time);

    const pu = [];
    if (game.player.shield > 0) pu.push('🛡️ Escudo');
    if (game.player.weapon >= 2) pu.push(game.player.weapon === 3 ? '🔥 Cañón Cuádruple' : '⚡ Cañón Triple');
    if (game.player.boostTimer > 0) pu.push(`🚀 Turbo (${Math.ceil(game.player.boostTimer)}s)`);
    document.getElementById('powerups').textContent = pu.join(' · ');

    const fpsEl = document.getElementById('fps');
    if (fpsEl) fpsEl.textContent = game.settings.showFps ? `FPS: ${game.fps.toFixed(0)}` : '';

    if (this.bossHud) {
      if (game.boss.active) {
        this.bossHud.classList.remove('hidden');
        document.getElementById('bossName').textContent = `⚠️ ${game.boss.name}`;
        const spdPct = Math.round(game.boss.speedMultiplier * 100);
        const phaseTag =
          game.boss.enragePhase === 3
            ? '🔥 FURIA MÁXIMA'
            : game.boss.enragePhase === 2
            ? '⚡ OVERCLOCK'
            : 'ACTIVO';
        document.getElementById('bossOverclock').textContent = `${phaseTag} • VEL: ${spdPct}%`;
        document.getElementById('bossHpBar').style.width =
          Math.max(0, (game.boss.hp / game.boss.maxHp) * 100) + '%';
      } else {
        this.bossHud.classList.add('hidden');
      }
    }
  }

  refreshScores() {
    const arr = loadScores();
    const el = document.getElementById('scoreboard');
    const levels = arr
      .filter(e => e.mode === 'levels')
      .sort((a, b) => b.level - a.level || b.score - a.score)
      .slice(0, 10);
    const arcade = arr
      .filter(e => e.mode === 'arcade')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    let html = '<h3 style="color:var(--accent)">Modo Ruta Gen Tech (Niveles)</h3>';
    if (!levels.length) html += '<p>Sin registros aún. ¡Sé el primer piloto!</p>';
    else {
      html += '<table><tr><th>#</th><th>Piloto</th><th>Nivel</th><th>Puntos</th><th>Tiempo</th></tr>';
      levels.forEach((e, i) => {
        html += `<tr><td>${i + 1}</td><td>${escapeHtml(e.name || 'Piloto Tech')}</td><td>Nivel ${e.level}</td><td>${e.score}</td><td>${e.time}s</td></tr>`;
      });
      html += '</table>';
    }

    html += '<h3 style="color:var(--accent); margin-top:14px">Modo Arcade Infinito</h3>';
    if (!arcade.length) html += '<p>Sin registros aún.</p>';
    else {
      html += '<table><tr><th>#</th><th>Piloto</th><th>Puntos</th><th>Tiempo</th></tr>';
      arcade.forEach((e, i) => {
        html += `<tr><td>${i + 1}</td><td>${escapeHtml(e.name || 'Piloto Tech')}</td><td>${e.score}</td><td>${e.time}s</td></tr>`;
      });
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
