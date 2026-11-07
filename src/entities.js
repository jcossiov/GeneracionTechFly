// src/entities.js
import * as THREE from 'three';
import { CONFIG, POWERUP_TYPES } from './config.js?v=10';

// ---------- Player ----------
export class Player {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.4,2.0), new THREE.MeshLambertMaterial({color:0x4cc9f0}));
    body.position.z = 0;
    this.group.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25,0.8,8), new THREE.MeshLambertMaterial({color:0x90e0ef}));
    nose.rotation.x = -Math.PI/2;
    nose.position.z = 1.4;
    this.group.add(nose);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6,0.12,0.9), new THREE.MeshLambertMaterial({color:0x0077b6}));
    wing.position.z = -0.1;
    this.group.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.0,0.1,0.5), new THREE.MeshLambertMaterial({color:0x0077b6}));
    tail.position.z = -0.9;
    this.group.add(tail);
    const vtail = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.7,0.5), new THREE.MeshLambertMaterial({color:0x0096c7}));
    vtail.position.set(0,0.35,-0.9);
    this.group.add(vtail);
    // engine glow
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8), new THREE.MeshBasicMaterial({color:0xffa500}));
    glow.position.z = -1.1;
    this.group.add(glow);
    this.glow = glow;

    scene.add(this.group);
    this.group.position.set(0,0,CONFIG.playerZ);

    this.maxHp = CONFIG.playerMaxHp;
    this.hp = this.maxHp;
    this.maxShield = CONFIG.playerMaxShield;
    this.shield = 0;
    this.weapon = 1; // 1..3
    this.fireCooldown = 0;
    this.boostTimer = 0;
    this.invuln = 0;
    this.alive = true;
    this.radius = 0.9;
  }

  reset() {
    this.group.position.set(0,0,CONFIG.playerZ);
    this.hp = this.maxHp;
    this.shield = 0;
    this.weapon = 1;
    this.fireCooldown = 0;
    this.boostTimer = 0;
    this.invuln = 0;
    this.alive = true;
  }

  update(dt, input, bounds) {
    if (!this.alive) return;
    const speed = CONFIG.playerSpeed * ((input.boost || this.boostTimer > 0) ? CONFIG.boostMult : 1);
    // keyboard/touch/gamepad movement
    let mx = input.mx, my = input.my;
    // mouse drag movement
    if (input.mouseMoveX || input.mouseMoveY) {
      mx += (input.mouseMoveX || 0) * 0.02 * (this.settings?.mouseSens||1.5);
      my += (input.mouseMoveY || 0) * 0.02 * (this.settings?.mouseSens||1.5);
    }
    const len = Math.hypot(mx,my);
    if (len > 1) { mx/=len; my/=len; }
    this.group.position.x += mx * speed * dt;
    this.group.position.y -= my * speed * dt; // screen y down -> world y up
    this.group.position.x = Math.max(-CONFIG.boundsX, Math.min(CONFIG.boundsX, this.group.position.x));
    this.group.position.y = Math.max(-CONFIG.boundsY, Math.min(CONFIG.boundsY, this.group.position.y));

    // banking
    this.group.rotation.z = -mx * 0.5;
    this.group.rotation.x = my * 0.3;

    // engine glow pulse
    this.glow.scale.setScalar(1 + Math.sin(performance.now()*0.02)*0.15);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.boostTimer > 0) this.boostTimer -= dt;
  }

  canFire() { return this.fireCooldown <= 0; }
  onFire() {
    this.fireCooldown = CONFIG.fireRate / (this.weapon >= 2 ? 1.3 : 1) / (this.boostTimer>0?1.2:1);
  }

  takeDamage(amount) {
    if (this.invuln > 0) return false;
    if (this.shield > 0) {
      if (amount <= this.shield) {
        this.shield -= amount;
        this.invuln = 0.2;
        return true;
      }
      amount -= this.shield;
      this.shield = 0;
    }
    this.hp -= amount;
    this.invuln = 0.6;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; }
    return true;
  }

  addShield(v) { this.shield = Math.min(this.maxShield, this.shield + v); }
  heal(v) { this.hp = Math.min(this.maxHp, this.hp + v); }
}

// ---------- Bullet ----------
export class Bullet {
  constructor(scene, isPlayer=true) {
    this.scene = scene;
    this.isPlayer = isPlayer;
    const color = isPlayer ? 0xfff176 : 0xff4d6d;
    const geo = new THREE.CylinderGeometry(0.08,0.08,0.6,6);
    const mat = new THREE.MeshBasicMaterial({color});
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = Math.PI/2;
    scene.add(this.mesh);
    this.active = false;
    this.velocity = new THREE.Vector3();
    this.damage = isPlayer ? 20 : 15;
    this.life = 3;
  }
  spawn(pos, dir, speed) {
    this.mesh.position.copy(pos);
    this.velocity.copy(dir).multiplyScalar(speed);
    this.active = true;
    this.life = 3;
    this.mesh.visible = true;
  }
  update(dt) {
    if (!this.active) return;
    this.mesh.position.addScaledVector(this.velocity, dt);
    this.life -= dt;
    if (this.life <= 0 || this.mesh.position.z > CONFIG.spawnZ+10 || this.mesh.position.z < CONFIG.despawnZ-10) {
      this.deactivate();
    }
  }
  deactivate() { this.active = false; this.mesh.visible = false; }
}

export class BulletPool {
  constructor(scene, size, isPlayer) {
    this.pool = [];
    for (let i=0;i<size;i++) this.pool.push(new Bullet(scene, isPlayer));
  }
  get() {
    let b = this.pool.find(x=>!x.active);
    if (!b) { b = this.pool[0]; b.deactivate(); }
    return b;
  }
  update(dt) { for (const b of this.pool) if (b.active) b.update(dt); }
  active() { return this.pool.filter(b=>b.active); }
}

// ---------- Enemy ----------
export class Enemy {
  constructor(scene, type) {
    this.scene = scene;
    this.type = type;
    this.group = new THREE.Group();
    this.buildMesh(type);
    scene.add(this.group);
    this.active = false;
    this.hp = 1;
    this.maxHp = 1;
    this.speed = CONFIG.baseSpeed * 0.6;
    this.fireCooldown = 1;
    this.scoreValue = CONFIG.scorePerKill;
    this.radius = 0.8;
    this.phase = Math.random()*Math.PI*2;
    this.velocity = new THREE.Vector3(0,0,-CONFIG.baseSpeed*0.5);
    this.pattern = 'straight';
    this.targetY = 0;
  }

  buildMesh(type) {
    let color = 0xff4d6d;
    if (type === 'fighter') { color=0xff4d6d; this.radius=0.7; }
    else if (type === 'bomber') { color=0xff8c42; this.radius=1.1; }
    else if (type === 'kamikaze') { color=0xff006e; this.radius=0.6; }
    else if (type === 'blocker') { color=0x8338ec; this.radius=1.6; }
    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1,0.5,1.6), new THREE.MeshLambertMaterial({color}));
    this.group.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.1,0.7), new THREE.MeshLambertMaterial({color:0x555555}));
    wing.position.z = 0.1;
    this.group.add(wing);
    if (type === 'bomber') {
      const body2 = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.7,2.2), new THREE.MeshLambertMaterial({color:0xffa500}));
      this.group.children[0].geometry = body2.geometry;
    }
    if (type === 'blocker') {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(6,2.5,0.6), new THREE.MeshLambertMaterial({color:0x8338ec}));
      // replace children
      while (this.group.children.length) this.group.remove(this.group.children[0]);
      this.group.add(wall);
    }
  }

  spawn(x,y,z, type, difficulty=1) {
    this.type = type;
    this.group.position.set(x,y,z);
    this.active = true;
    this.group.visible = true;
    this.phase = Math.random()*Math.PI*2;
    if (type === 'fighter') {
      this.hp = 1; this.maxHp=1; this.speed = CONFIG.baseSpeed*0.7*difficulty;
      this.fireCooldown = 1.2/difficulty; this.scoreValue = 50; this.radius=0.7;
      this.pattern = 'sine';
    } else if (type === 'bomber') {
      this.hp = 4; this.maxHp=4; this.speed = CONFIG.baseSpeed*0.45;
      this.fireCooldown = 1.8; this.scoreValue = 120; this.radius=1.1;
      this.pattern = 'straight';
    } else if (type === 'kamikaze') {
      this.hp = 1; this.maxHp=1; this.speed = CONFIG.baseSpeed*1.1*difficulty;
      this.fireCooldown = 99; this.scoreValue = 60; this.radius=0.6;
      this.pattern = 'chase';
    } else if (type === 'blocker') {
      this.hp = 12 + difficulty*4; this.maxHp=this.hp; this.speed = CONFIG.baseSpeed*0.25;
      this.fireCooldown = 99; this.scoreValue = 200; this.radius=1.6;
      this.pattern = 'straight';
    }
    this.velocity.set(0,0,-this.speed);
  }

  update(dt, playerPos, worldSpeed) {
    if (!this.active) return;
    const t = performance.now()*0.001;
    const p = this.group.position;
    // base scroll
    p.z += this.velocity.z * dt;
    // patterns
    if (this.pattern === 'sine') {
      if (this._baseX === undefined) this._baseX = p.x;
      p.x = this._baseX + Math.sin(t*2 + this.phase)*2.5;
    }
    if (this.pattern === 'chase') {
      const dx = playerPos.x - p.x;
      const dy = playerPos.y - p.y;
      p.x += dx * 1.5 * dt;
      p.y += dy * 1.5 * dt;
    }
    if (this.pattern === 'straight') {
      // slight drift
    }
    // store base x for sine handled above

    this.fireCooldown -= dt;
    if (p.z < CONFIG.despawnZ) this.deactivate();
  }

  canFire() { return this.fireCooldown <= 0; }
  onFire() {
    if (this.type === 'fighter') this.fireCooldown = 1.4;
    else if (this.type === 'bomber') this.fireCooldown = 2.0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) { this.hp = 0; this.deactivate(); return true; }
    return false;
  }

  deactivate() { this.active = false; this.group.visible = false; this._baseX = undefined; }
}

export class EnemyPool {
  constructor(scene, size) {
    this.pool = [];
    for (let i=0;i<size;i++) this.pool.push(new Enemy(scene, 'fighter'));
  }
  get(type) {
    let e = this.pool.find(x=>!x.active);
    if (!e) { e = new Enemy(this.pool[0].scene, type); this.pool.push(e); }
    // rebuild mesh if type differs? mesh built in constructor; rebuild
    // For simplicity, reconstruct group mesh by clearing
    e.type = type;
    while (e.group.children.length) e.group.remove(e.group.children[0]);
    // rebuild via a fresh enemy mesh using a temp
    const tmp = new Enemy(e.scene, type);
    // copy children meshes
    while (tmp.group.children.length) {
      const c = tmp.group.children[0];
      tmp.group.remove(c);
      e.group.add(c);
    }
    tmp.group.visible = false;
    // remove tmp group from scene
    e.scene.remove(tmp.group);
    return e;
  }
  update(dt, playerPos) {
    for (const e of this.pool) if (e.active) e.update(dt, playerPos);
  }
  active() { return this.pool.filter(e=>e.active); }
}

// ---------- Obstacle ----------
export class Obstacle {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.active = false;
    this.type = 'asteroid';
    this.hp = 1;
    this.destructible = true;
    this.radius = 1;
    this.scoreValue = CONFIG.scorePerObstacle;
    this.rotSpeed = new THREE.Vector3();
  }
  spawn(x,y,z, kind, difficulty=1) {
    // remove old mesh
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh = null; }
    this.kind = kind;
    this.active = true;
    if (kind === 'asteroid') {
      const r = 0.6 + Math.random()*1.2;
      const geo = new THREE.IcosahedronGeometry(r, 0);
      const mat = new THREE.MeshLambertMaterial({color:0x8d99ae, flatShading:true});
      this.mesh = new THREE.Mesh(geo, mat);
      this.radius = r;
      this.hp = Math.ceil(r*2);
      this.destructible = true;
      this.rotSpeed.set(Math.random()*2, Math.random()*2, Math.random()*2);
    } else if (kind === 'debris') {
      const geo = new THREE.BoxGeometry(1.2,0.4,1.2);
      const mat = new THREE.MeshLambertMaterial({color:0x6c757d});
      this.mesh = new THREE.Mesh(geo, mat);
      this.radius = 0.9;
      this.hp = 2;
      this.destructible = true;
      this.rotSpeed.set(0.5,1,0.3);
    } else if (kind === 'pillar') {
      const geo = new THREE.CylinderGeometry(0.7,0.7,6,8);
      const mat = new THREE.MeshLambertMaterial({color:0x495057});
      this.mesh = new THREE.Mesh(geo, mat);
      this.radius = 0.9;
      this.hp = 999;
      this.destructible = false;
      this.rotSpeed.set(0,0.5,0);
    } else {
      const r = 1;
      const geo = new THREE.IcosahedronGeometry(r, 0);
      const mat = new THREE.MeshLambertMaterial({color:0x8d99ae, flatShading:true});
      this.mesh = new THREE.Mesh(geo, mat);
      this.radius = r;
      this.hp = 2;
      this.destructible = true;
      this.rotSpeed.set(1,1,1);
    }
    this.mesh.position.set(x,y,z);
    this.scene.add(this.mesh);
  }
  update(dt) {
    if (!this.active || !this.mesh) return;
    this.mesh.position.z -= CONFIG.baseSpeed * 0.5 * dt; // slower scroll for obstacles? keep consistent
    // Actually obstacles should scroll at world speed; game will set velocity externally? We'll adjust: use baseSpeed
    this.mesh.rotation.x += this.rotSpeed.x*dt;
    this.mesh.rotation.y += this.rotSpeed.y*dt;
    this.mesh.rotation.z += this.rotSpeed.z*dt;
    if (this.mesh.position.z < CONFIG.despawnZ) this.deactivate();
  }
  setZSpeed(v) { this._zspeed = v; }
  updateWithSpeed(dt, speed) {
    if (!this.active || !this.mesh) return;
    this.mesh.position.z -= speed * dt;
    this.mesh.rotation.x += this.rotSpeed.x*dt;
    this.mesh.rotation.y += this.rotSpeed.y*dt;
    this.mesh.rotation.z += this.rotSpeed.z*dt;
    if (this.mesh.position.z < CONFIG.despawnZ) this.deactivate();
  }
  takeDamage(amount) {
    if (!this.destructible) return false;
    this.hp -= amount;
    if (this.hp <= 0) { this.deactivate(); return true; }
    return false;
  }
  deactivate() {
    this.active = false;
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh = null; }
  }
}

export class ObstaclePool {
  constructor(scene, size) {
    this.scene = scene;
    this.pool = [];
    for (let i=0;i<size;i++) this.pool.push(new Obstacle(scene));
  }
  get(kind) {
    let o = this.pool.find(x=>!x.active);
    if (!o) { o = new Obstacle(this.scene); this.pool.push(o); }
    return o;
  }
  update(dt, speed) {
    for (const o of this.pool) if (o.active) o.updateWithSpeed(dt, speed);
  }
  active() { return this.pool.filter(o=>o.active); }
}

// ---------- PowerUp ----------
export class PowerUp {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.active = false;
    this.type = 'shield';
    this.radius = 0.9;
    this.vy = 0;
  }
  spawn(x,y,z,type) {
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh=null; }
    this.type = type;
    this.active = true;
    const color = type==='shield'?0x4cc9f0:type==='health'?0x70e000:type==='double'?0xfff176:type==='triple'?0xff006e:type==='boost'?0xffa500:0xffffff;
    let geo;
    if (type === 'shield') geo = new THREE.SphereGeometry(0.7, 12, 12);
    else if (type === 'health') geo = new THREE.BoxGeometry(0.9,0.9,0.9);
    else if (type === 'double') geo = new THREE.CylinderGeometry(0.2,0.2,1.2,8);
    else if (type === 'triple') geo = new THREE.ConeGeometry(0.6,1.2,8);
    else if (type === 'boost') geo = new THREE.OctahedronGeometry(0.7,0);
    else geo = new THREE.OctahedronGeometry(0.7,0);
    const mat = new THREE.MeshLambertMaterial({color, emissive: color, emissiveIntensity: 0.25});
    this.mesh = new THREE.Mesh(geo, mat);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.25,8,8), new THREE.MeshBasicMaterial({color:0xffffff}));
    this.mesh.add(inner);
    this.mesh.position.set(x,y,z);
    this.scene.add(this.mesh);
  }
  update(dt, speed) {
    if (!this.active || !this.mesh) return;
    this.mesh.position.z -= speed*dt;
    this.mesh.rotation.y += 2*dt;
    this.mesh.rotation.x += 1*dt;
    if (this.mesh.position.z < CONFIG.despawnZ) this.deactivate();
  }
  deactivate() { this.active=false; if(this.mesh){this.scene.remove(this.mesh);this.mesh=null;} }
}

export class PowerUpPool {
  constructor(scene,size){this.scene=scene;this.pool=[];for(let i=0;i<size;i++)this.pool.push(new PowerUp(scene));}
  get(){let p=this.pool.find(x=>!x.active); if(!p){p=new PowerUp(this.scene);this.pool.push(p);} return p;}
  update(dt,speed){for(const p of this.pool) if(p.active)p.update(dt,speed);}
  active(){return this.pool.filter(p=>p.active);}
}

// ---------- Particle ----------
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }
  burst(pos, color, count=16, speed=6) {
    for (let i=0;i<count;i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6), new THREE.MeshBasicMaterial({color}));
      m.position.copy(pos);
      this.scene.add(m);
      const dir = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize().multiplyScalar(speed*(0.5+Math.random()));
      this.particles.push({ mesh:m, vel:dir, life:0.6+Math.random()*0.4, max:1.0 });
    }
  }
  update(dt) {
    for (let i=this.particles.length-1;i>=0;i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(0.92);
      p.mesh.scale.setScalar(Math.max(0.01, p.life));
      if (p.life <= 0) { this.scene.remove(p.mesh); this.particles.splice(i,1); }
    }
  }
}

// ---------- Boss ----------
export class Boss {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // core
    const core = new THREE.Mesh(new THREE.SphereGeometry(2.2,12,12), new THREE.MeshLambertMaterial({color:0x9d4edd}));
    this.group.add(core);
    // wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(7,0.3,2), new THREE.MeshLambertMaterial({color:0x5a189a}));
    this.group.add(wing);
    // turrets
    for (let i=-1;i<=1;i++) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,1,8), new THREE.MeshLambertMaterial({color:0xff4d6d}));
      t.rotation.x = Math.PI/2;
      t.position.set(i*2, 0, 1.4);
      this.group.add(t);
    }
    scene.add(this.group);
    this.active = false;
    this.maxHp = 200;
    this.hp = this.maxHp;
    this.radius = 2.6;
    this.scoreValue = 1000;
    this.phase = 0;
    this.fireCooldown = 1.5;
    this.vulnerable = true;
  }
  spawn(z, difficulty=1) {
    this.group.position.set(0, 1, z);
    this.active = true;
    this.group.visible = true;
    this.maxHp = 200 + difficulty*80;
    this.hp = this.maxHp;
    this.fireCooldown = 1.2;
    this.phase = 0;
  }
  update(dt, playerPos, worldSpeed) {
    if (!this.active) return;
    const t = performance.now()*0.001;
    this.group.position.z -= worldSpeed*0.3*dt; // slowly approaches? actually boss stays ahead
    // hover pattern
    this.group.position.x = Math.sin(t*0.8)*3;
    this.group.position.y = 1 + Math.sin(t*1.2)*1.2;
    // face player
    this.group.rotation.y = Math.atan2(playerPos.x - this.group.position.x, playerPos.z - this.group.position.z);
    this.phase += dt;
    this.fireCooldown -= dt;
    if (this.group.position.z < 8) this.group.position.z = 8; // keep ahead
  }
  canFire() { return this.fireCooldown <= 0; }
  onFire() { this.fireCooldown = 1.0; }
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) { this.hp=0; this.deactivate(); return true; }
    return false;
  }
  deactivate() { this.active=false; this.group.visible=false; }
}
