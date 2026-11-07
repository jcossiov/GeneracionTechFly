// src/game.js
import * as THREE from 'three';
import { CONFIG, POWERUP_TYPES, DEFAULT_BINDINGS } from './config.js?v=11';
import { Player } from './entities.js?v=11';
import { EnemyPool, BulletPool, ObstaclePool, PowerUpPool, ParticleSystem, Boss } from './entities.js?v=11';
import { LevelManager } from './level.js?v=11';
import { AudioEngine } from './audio.js?v=11';
import { InputManager } from './controls.js?v=11';
import { saveScore, loadSettings, saveSettings, loadBindings, saveBindings, loadPlayerName, savePlayerName } from './storage.js?v=11';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050810);
    this.scene.fog = new THREE.Fog(0x050810, CONFIG.fogNear, CONFIG.fogFar);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 6, -12);
    this.camera.lookAt(0,0,8);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;

    // lights
    const amb = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5,10,-5);
    this.scene.add(dir);
    const point = new THREE.PointLight(0x4cc9f0, 0.6, 40);
    point.position.set(0,4,5);
    this.scene.add(point);

    // starfield
    this.stars = this.createStars();
    this.scene.add(this.stars);

    // pools
    this.playerBullets = new BulletPool(this.scene, 40, true);
    this.enemyBullets = new BulletPool(this.scene, 60, false);
    this.enemies = new EnemyPool(this.scene, 24);
    this.obstacles = new ObstaclePool(this.scene, 30);
    this.powerups = new PowerUpPool(this.scene, 8);
    this.particles = new ParticleSystem(this.scene);
    this.boss = new Boss(this.scene);

    this.player = new Player(this.scene);

    this.levelManager = new LevelManager();
    this.audio = new AudioEngine();
    this.settings = Object.assign({ musicVol:0.35, sfxVol:0.6, mouseSens:1.5, showFps:false, vibrate:true }, loadSettings());
    this.player.settings = this.settings;
    this.audio.setMusicVolume(this.settings.musicVol);
    this.audio.setSfxVolume(this.settings.sfxVol);
    const loadedBindings = loadBindings();
    this.bindings = loadedBindings ? loadedBindings : JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    this.playerName = loadPlayerName() || 'Piloto';
    this.input = new InputManager(canvas, this.settings, this.bindings);

    this.state = 'menu'; // menu, playing, paused, gameover, levelTransition
    this.score = 0;
    this.time = 0;
    this.worldSpeed = CONFIG.baseSpeed;
    this.lastTime = performance.now();
    this.fps = 0; this._fpsAcc=0; this._fpsFrames=0;
    this._lastShot = 0;
    this._bossSpawned = false;
    this._levelCompletePending = false;

    // bind UI
    this.ui = null;

    // warm-up: compile shaders and render first frame to avoid hitch
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  setUI(ui) { this.ui = ui; }

  createStars() {
    const geo = new THREE.BufferGeometry();
    const count = 800;
    const pos = new Float32Array(count*3);
    for (let i=0;i<count;i++) {
      pos[i*3] = (Math.random()*2-1)*60;
      pos[i*3+1] = (Math.random()*2-1)*40;
      pos[i*3+2] = Math.random()*120;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({ color:0xffffff, size:0.15, sizeAttenuation:true });
    return new THREE.Points(geo, mat);
  }

  onResize() {
    this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startMode(mode) {
    this.resetRun();
    this.levelManager.start(mode);
    this.state = 'playing';
    // defer audio to avoid init hitch
    setTimeout(() => {
      this.audio.ensure();
      this.audio.resumeMusic();
    }, 0);
    if (this.ui) this.ui.showHUD(true);
    if (mode === 'levels') this.showLevelSplash(this.levelManager.level);
  }

  resetRun() {
    this.player.reset();
    this.score = 0;
    this.time = 0;
    this.worldSpeed = CONFIG.baseSpeed;
    // deactivate all
    for (const p of this.playerBullets.pool) p.deactivate();
    for (const p of this.enemyBullets.pool) p.deactivate();
    for (const e of this.enemies.pool) e.deactivate();
    for (const o of this.obstacles.pool) o.deactivate();
    for (const p of this.powerups.pool) p.deactivate();
    this.boss.deactivate();
    this._bossSpawned = false;
    this._levelCompletePending = false;
  }

  showLevelSplash(lvl) {
    this.state = 'levelTransition';
    if (this.ui) this.ui.showLevelSplash(lvl, () => { this.state = 'playing'; });
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.audio.stopMusic();
    if (this.ui) this.ui.showPause(true);
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.audio.resumeMusic();
    if (this.ui) this.ui.showPause(false);
  }

  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.player.alive = false;
    this.audio.stopMusic();
    this.audio.explode(true);
    // save score
    const mode = this.levelManager.mode;
    saveScore({ name: this.playerName, score: Math.floor(this.score), mode, level: this.levelManager.level, time: Math.floor(this.time), date: Date.now() });
    if (this.ui) this.ui.showGameOver(Math.floor(this.score), this.levelManager.level, this.time);
  }

  levelComplete() {
    if (this._levelCompletePending === false && this.levelManager.state !== 'transition') return;
    this.audio.levelup();
    if (this.ui) this.ui.toast(`¡Nivel ${this.levelManager.level} completado!`);
    this.levelManager.advanceLevel();
    // reset field
    for (const e of this.enemies.pool) e.deactivate();
    for (const o of this.obstacles.pool) o.deactivate();
    for (const b of this.enemyBullets.pool) b.deactivate();
    this.boss.deactivate();
    this._bossSpawned = false;
    this._levelCompletePending = false;
    this.showLevelSplash(this.levelManager.level);
  }

  update(dt) {
    if (dt > 0.1) dt = 0.1;
    // fps
    this._fpsAcc += dt; this._fpsFrames++;
    if (this._fpsAcc >= 0.5) { this.fps = this._fpsFrames/this._fpsAcc; this._fpsAcc=0; this._fpsFrames=0; }

    // input poll
    const input = this.input.poll();
    input.mouseMoveX = this.input.mouseMoveX;
    input.mouseMoveY = this.input.mouseMoveY;
    input.settings = this.settings;

    if (this.input.consumePaused()) {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
    }

    if (this.state === 'levelTransition') {
      // wait for splash callback
      this.render();
      return;
    }
    if (this.state !== 'playing') {
      this.render();
      return;
    }

    this.time += dt;
    // difficulty / speed
    if (this.levelManager.mode === 'arcade') {
      this.levelManager.update(dt);
      this.worldSpeed = Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + this.levelManager.arcadeTime*0.05);
    } else {
      this.levelManager.update(dt);
      this.worldSpeed = CONFIG.baseSpeed + (this.levelManager.level-1)*2;
      // state transitions
      if (this.levelManager.state === 'boss' && !this._bossSpawned) {
        this._bossSpawned = true;
        this.boss.spawn(CONFIG.spawnZ, this.levelManager.difficulty);
        this.audio.boss();
      }
      if (this.levelManager.state === 'transition' && !this._levelCompletePending) {
        this._levelCompletePending = true;
        this.levelComplete();
      }
    }

    // player update
    this.player.update(dt, input, null);
    if (!this.player.alive) { this.gameOver(); return; }

    // shooting
    if (input.fire) {
      if (this.player.canFire()) {
        this.firePlayer();
        this.player.onFire();
        this.audio.shoot(this.player.weapon);
      }
    }

    // spawns
    const spawns = this.levelManager.getSpawns(dt);
    for (const s of spawns) {
      if (s.kind === 'enemy') {
        const e = this.enemies.get(s.type);
        e.spawn(s.x, s.y, CONFIG.spawnZ, s.type, this.levelManager.difficulty);
      } else if (s.kind === 'obstacle') {
        const o = this.obstacles.get(s.type);
        o.spawn(s.x, s.y, CONFIG.spawnZ, s.type, this.levelManager.difficulty);
      } else if (s.kind === 'powerup') {
        const p = this.powerups.get();
        p.spawn(s.x, s.y, CONFIG.spawnZ, s.type);
      } else if (s.kind === 'boss') {
        this.boss.spawn(CONFIG.spawnZ, this.levelManager.difficulty);
        this._bossSpawned = true;
      }
    }

    // update enemies
    const playerPos = this.player.group.position;
    this.enemies.update(dt, playerPos);
    // enemy firing
    for (const e of this.enemies.active()) {
      if (e.canFire() && e.group.position.z < CONFIG.spawnZ-5 && e.group.position.z > 5) {
        // fire toward player
        const dir = new THREE.Vector3().subVectors(playerPos, e.group.position).normalize();
        const b = this.enemyBullets.get();
        b.spawn(e.group.position.clone().add(new THREE.Vector3(0,0,-0.5)), dir, CONFIG.enemyBulletSpeed);
        b.damage = 12;
        e.onFire();
      }
    }
    // boss update + fire
    if (this.boss.active) {
      this.boss.update(dt, playerPos, this.worldSpeed);
      if (this.boss.canFire()) {
        // spread shots
        for (let i=-2;i<=2;i++) {
          const dir = new THREE.Vector3(i*0.3, 0, -1).normalize();
          const b = this.enemyBullets.get();
          b.spawn(this.boss.group.position.clone(), dir, CONFIG.enemyBulletSpeed*1.2);
          b.damage = 15;
        }
        this.boss.onFire();
      }
    }

    // update bullets
    this.playerBullets.update(dt);
    this.enemyBullets.update(dt);

    // update obstacles
    this.obstacles.update(dt, this.worldSpeed);
    // update powerups
    this.powerups.update(dt, this.worldSpeed);
    // particles
    this.particles.update(dt);

    // stars scroll
    const starPos = this.stars.geometry.attributes.position;
    for (let i=0;i<starPos.count;i++) {
      let z = starPos.getZ(i);
      z -= this.worldSpeed*0.3*dt;
      if (z < -20) z += 120;
      starPos.setZ(i, z);
    }
    starPos.needsUpdate = true;

    // collisions
    try { this.handleCollisions(); }
    catch (e) { console.error('Collision error', e); }

    // scoring over time
    this.score += CONFIG.scorePerSecond * dt;

    // enemy bullets hitting player etc handled in collisions

    // update HUD
    if (this.ui) this.ui.updateHUD(this);

    this.render();
  }

  firePlayer() {
    const pos = this.player.group.position.clone();
    pos.z += 1.2;
    const dir = new THREE.Vector3(0,0,1);
    const levels = this.player.weapon;
    if (levels === 1) {
      const b = this.playerBullets.get();
      b.spawn(pos, dir, CONFIG.bulletSpeed);
      b.damage = 20;
    } else if (levels === 2) {
      for (const off of [-0.3, 0.3]) {
        const b = this.playerBullets.get();
        const d = new THREE.Vector3(off,0,1).normalize();
        b.spawn(pos.clone().add(new THREE.Vector3(off*0.5,0,0)), d, CONFIG.bulletSpeed);
        b.damage = 20;
      }
    } else {
      for (const off of [-0.5,0,0.5]) {
        const b = this.playerBullets.get();
        const d = new THREE.Vector3(off*0.4,0,1).normalize();
        b.spawn(pos.clone().add(new THREE.Vector3(off*0.5,0,0)), d, CONFIG.bulletSpeed);
        b.damage = 20;
      }
    }
  }

  handleCollisions() {
    const playerPos = this.player.group.position;
    // player bullets vs enemies
    for (const b of this.playerBullets.active()) {
      // enemies
      for (const e of this.enemies.active()) {
        const d = b.mesh.position.distanceTo(e.group.position);
        if (d < 0.9 + e.radius) {
          const killed = e.takeDamage(b.damage);
          b.deactivate();
          this.particles.burst(b.mesh.position.clone(), 0xffaa00, 8, 5);
          this.audio.hit();
          if (killed) {
            this.score += e.scoreValue * (this.levelManager.mode==='arcade'?1.5:1);
            this.particles.burst(e.group.position.clone(), 0xff4d6d, 18, 6);
            this.audio.explode();
            if (this.settings.vibrate && navigator.vibrate) navigator.vibrate(30);
          }
          break;
        }
      }
      // boss
      if (this.boss.active && b.mesh.position.distanceTo(this.boss.group.position) < 2.6 + 0.5) {
        const killed = this.boss.takeDamage(b.damage);
        b.deactivate();
        this.particles.burst(b.mesh.position.clone(), 0xaa66ff, 10, 5);
        this.audio.hit();
        if (killed) {
          this.score += this.boss.scoreValue;
          this.particles.burst(this.boss.group.position.clone(), 0x9d4edd, 40, 8);
          this.audio.explode(true);
          this.levelManager.setBossDefeated();
          if (this.levelManager.state !== 'transition') this._bossSpawned = false;
          if (this.levelManager.mode === 'arcade') {
            // in arcade, boss not spawned normally; but if spawned treat as bonus
          }
        }
      }
      // obstacles
      for (const o of this.obstacles.active().filter(o=>o.mesh)) {
        if (!o.mesh) continue;
        if (b.mesh.position.distanceTo(o.mesh.position) < 0.5 + o.radius) {
          const opos = o.mesh.position.clone();
          const destroyed = o.takeDamage(b.damage);
          b.deactivate();
          this.particles.burst(b.mesh.position.clone(), 0xaaaaaa, 6, 4);
          this.audio.hit();
          if (destroyed) {
            this.score += CONFIG.scorePerObstacle;
            this.particles.burst(opos, 0x8d99ae, 12, 5);
            this.audio.explode();
          }
          break;
        }
      }
    }

    // enemy bullets vs player
    if (this.player.invuln <= 0) {
      for (const b of this.enemyBullets.active()) {
        if (b.mesh.position.distanceTo(playerPos) < 0.9) {
          b.deactivate();
          const died = this.player.takeDamage(b.damage);
          this.particles.burst(playerPos.clone(), 0xff4d6d, 12, 5);
          this.audio.damage();
          if (this.settings.vibrate && navigator.vibrate) navigator.vibrate(60);
          if (died) { /* handled in update checks hp */ }
          if (this.player.hp <= 0) { this.gameOver(); return; }
        }
      }
    }

    // enemies colliding with player
    if (this.player.invuln <= 0) {
      for (const e of this.enemies.active()) {
        if (e.group.position.distanceTo(playerPos) < e.radius + 0.7) {
          e.deactivate();
          this.player.takeDamage(25);
          this.particles.burst(e.group.position.clone(), 0xff4d6d, 16, 6);
          this.audio.damage();
          this.score += 10;
          if (this.player.hp <= 0) { this.gameOver(); return; }
        }
      }
    }

    // obstacles colliding with player
    if (this.player.invuln <= 0) {
      for (const o of this.obstacles.active().filter(o=>o.mesh)) {
        if (!o.mesh) continue;
        if (o.mesh.position.distanceTo(playerPos) < o.radius + 0.7) {
          const opos = o.mesh.position.clone();
          if (o.destructible) {
            o.deactivate();
            this.player.takeDamage(20);
          } else {
            this.player.takeDamage(40);
            o.deactivate();
          }
          this.particles.burst(opos, 0x8d99ae, 16, 6);
          this.audio.damage();
          if (this.player.hp <= 0) { this.gameOver(); return; }
        }
      }
    }

    // boss colliding with player
    if (this.boss.active && this.player.invuln <= 0) {
      if (this.boss.group.position.distanceTo(playerPos) < this.boss.radius + 0.7) {
        this.player.takeDamage(35);
        this.particles.burst(playerPos.clone(), 0x9d4edd, 16, 6);
        this.audio.damage();
        if (this.player.hp <= 0) { this.gameOver(); return; }
      }
    }

    // powerups
    for (const p of this.powerups.active()) {
      if (!p.mesh) continue;
      if (p.mesh.position.distanceTo(playerPos) < 1.2) {
        this.applyPowerup(p.type);
        p.deactivate();
        this.audio.powerup();
        this.particles.burst(playerPos.clone(), 0xffffff, 14, 4);
      }
    }
  }

  applyPowerup(type) {
    switch (type) {
      case 'shield': this.player.addShield(40); break;
      case 'health': this.player.heal(35); break;
      case 'double': this.player.weapon = Math.min(3, this.player.weapon + 1); break;
      case 'triple': this.player.weapon = 3; break;
      case 'boost': this.player.boostTimer = Math.min(30, this.player.boostTimer + 6); break;
    }
    if (this.ui) this.ui.toast(type.toUpperCase());
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
