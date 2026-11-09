// src/entities.js
import * as THREE from 'three';
import { CONFIG } from './config.js?v=13';

// ---------- Caché Global de Geometrías y Materiales (Zero-Lag) ----------
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 12, 12),
  lowSphere: new THREE.SphereGeometry(1, 7, 7),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 10),
  icosa: new THREE.IcosahedronGeometry(1, 0),
  octa: new THREE.OctahedronGeometry(1, 0),
  torus: new THREE.TorusGeometry(1, 0.12, 8, 20),
  plane: new THREE.PlaneGeometry(1, 1),
};

const MAT = {
  hullPrimary: new THREE.MeshStandardMaterial({ color: 0x181e36, emissive: 0x0c1228, emissiveIntensity: 0.35, metalness: 0.75, roughness: 0.22 }),
  hullSecondary: new THREE.MeshStandardMaterial({ color: 0x0b1022, metalness: 0.85, roughness: 0.28 }),
  hullAccent: new THREE.MeshStandardMaterial({ color: 0xffc700, emissive: 0xd97706, emissiveIntensity: 0.75, metalness: 0.6, roughness: 0.2 }),
  hullNose: new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x0284c7, emissiveIntensity: 0.55, metalness: 0.7, roughness: 0.18 }),
  canopyGlass: new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 0.4,
    metalness: 0.15,
    roughness: 0.08,
    transparent: true,
    opacity: 0.82,
  }),
  cockpitFrame: new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.25 }),
  navRed: new THREE.MeshBasicMaterial({ color: 0xff2a55 }),
  navGreen: new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
  playerBulletCore: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  playerBulletGlow: new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.75 }),
  enemyBulletCore: new THREE.MeshBasicMaterial({ color: 0xffccd5 }),
  enemyBulletGlow: new THREE.MeshBasicMaterial({ color: 0xff2a55, transparent: true, opacity: 0.75 }),
  enemyFighter: new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x881337, emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.3 }),
  enemyBomber: new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x7c2d12, emissiveIntensity: 0.35, metalness: 0.65, roughness: 0.35 }),
  enemyKamikaze: new THREE.MeshStandardMaterial({ color: 0xff006e, emissive: 0x9d0208, emissiveIntensity: 0.55, metalness: 0.75, roughness: 0.2 }),
  enemyBlocker: new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x4c1d95, emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.3 }),
  enemyWing: new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 }),
  asteroid: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.15, flatShading: true }),
  debris: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 }),
  pillar: new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x0284c7, emissiveIntensity: 0.25, metalness: 0.75, roughness: 0.25 }),
  arduinoPcb: new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x065f46, emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.4 }),
  arduinoChip: new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 }),
  goldPin: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15 }),
  print3dMat: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.4, wireframe: true }),
  iotNodeMat: new THREE.MeshStandardMaterial({ color: 0xf72585, emissive: 0xbe185d, emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.2 }),
  codeBlockMat: new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x5b21b6, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.25 }),
};

// ---------- Player (Caza Realista Gen Tech X-1 en Vista Panorámica) ----------
export class Player {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. Fuselaje central esculpido
    const mainFuselage = new THREE.Mesh(GEO.box, MAT.hullPrimary);
    mainFuselage.scale.set(0.72, 0.4, 2.5);
    mainFuselage.position.set(0, 0, 0);
    this.group.add(mainFuselage);

    // Lomo superior aerodinámico
    const spine = new THREE.Mesh(GEO.box, MAT.hullSecondary);
    spine.scale.set(0.44, 0.24, 2.1);
    spine.position.set(0, 0.22, -0.1);
    this.group.add(spine);

    // 2. Nariz supersónica principal
    const noseCone = new THREE.Mesh(GEO.cone, MAT.hullNose);
    noseCone.scale.set(0.36, 1.55, 0.3);
    noseCone.rotation.x = Math.PI / 2;
    noseCone.position.set(0, -0.02, 2.0);
    this.group.add(noseCone);

    // Franjas luminosas en la nariz
    for (const side of [-1, 1]) {
      const noseStripe = new THREE.Mesh(GEO.box, MAT.hullAccent);
      noseStripe.scale.set(0.07, 0.06, 1.35);
      noseStripe.position.set(side * 0.19, 0.12, 1.45);
      noseStripe.rotation.y = -side * 0.08;
      this.group.add(noseStripe);
    }

    // 3. Cabina de Cristal (Canopy)
    this.canopy = new THREE.Mesh(GEO.sphere, MAT.canopyGlass);
    this.canopy.scale.set(0.28, 0.24, 0.85);
    this.canopy.position.set(0, 0.3, 0.55);
    this.group.add(this.canopy);

    // 4. Tomas de aire laterales (Intakes)
    for (const side of [-1, 1]) {
      const intake = new THREE.Mesh(GEO.box, MAT.hullSecondary);
      intake.scale.set(0.34, 0.28, 1.7);
      intake.position.set(side * 0.48, -0.04, -0.15);
      this.group.add(intake);

      const intakeGlow = new THREE.Mesh(GEO.box, MAT.hullAccent);
      intakeGlow.scale.set(0.26, 0.07, 1.5);
      intakeGlow.position.set(side * 0.58, 0.08, -0.1);
      this.group.add(intakeGlow);
    }

    // 5. Alas en flecha (Delta Swept Wings) + Canards delanteros
    const mainWing = new THREE.Mesh(GEO.box, MAT.hullPrimary);
    mainWing.scale.set(3.3, 0.1, 1.05);
    mainWing.position.set(0, -0.02, -0.25);
    this.group.add(mainWing);

    const wingAccent = new THREE.Mesh(GEO.box, MAT.hullAccent);
    wingAccent.scale.set(3.05, 0.11, 0.16);
    wingAccent.position.set(0, 0.01, 0.18);
    this.group.add(wingAccent);

    for (const side of [-1, 1]) {
      const canard = new THREE.Mesh(GEO.box, MAT.hullAccent);
      canard.scale.set(0.58, 0.06, 0.32);
      canard.position.set(side * 0.5, 0.02, 0.95);
      canard.rotation.y = -side * 0.25;
      this.group.add(canard);
    }

    // Alerones móviles traseros
    this.aileronL = new THREE.Mesh(GEO.box, MAT.hullAccent);
    this.aileronL.scale.set(0.88, 0.07, 0.22);
    this.aileronL.position.set(-1.05, -0.02, -0.82);
    this.group.add(this.aileronL);

    this.aileronR = new THREE.Mesh(GEO.box, MAT.hullAccent);
    this.aileronR.scale.set(0.88, 0.07, 0.22);
    this.aileronR.position.set(1.05, -0.02, -0.82);
    this.group.add(this.aileronR);

    // Puntas de ala + Misiles + Luces de navegación
    for (const side of [-1, 1]) {
      const pod = new THREE.Mesh(GEO.cyl, MAT.hullSecondary);
      pod.scale.set(0.07, 1.15, 0.07);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(side * 1.66, -0.02, -0.15);
      this.group.add(pod);

      const navLight = new THREE.Mesh(GEO.lowSphere, side < 0 ? MAT.navRed : MAT.navGreen);
      navLight.scale.setScalar(0.09);
      navLight.position.set(side * 1.7, 0.04, -0.15);
      this.group.add(navLight);
    }

    // 6. Doble Deriva Vertical inclinada (Twin Canted Tails)
    for (const side of [-1, 1]) {
      const vTail = new THREE.Mesh(GEO.box, MAT.hullPrimary);
      vTail.scale.set(0.09, 0.74, 0.65);
      vTail.position.set(side * 0.42, 0.42, -1.02);
      vTail.rotation.z = -side * 0.28;
      this.group.add(vTail);

      const vTailTip = new THREE.Mesh(GEO.box, MAT.hullAccent);
      vTailTip.scale.set(0.1, 0.14, 0.62);
      vTailTip.position.set(side * 0.51, 0.74, -1.02);
      vTailTip.rotation.z = -side * 0.28;
      this.group.add(vTailTip);
    }

    // 7. Doble Turbina con Postcombustión (Twin Afterburners)
    this.flames = [];
    this.flameMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.92 });
    this.coreFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const side of [-0.25, 0.25]) {
      const nozzle = new THREE.Mesh(GEO.cyl, MAT.cockpitFrame);
      nozzle.scale.set(0.19, 0.36, 0.19);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(side, 0, -1.32);
      this.group.add(nozzle);

      const flame = new THREE.Mesh(GEO.cone, this.flameMat);
      flame.scale.set(0.18, 0.85, 0.18);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(side, 0, -1.75);
      this.group.add(flame);

      const innerCore = new THREE.Mesh(GEO.lowSphere, this.coreFlameMat);
      innerCore.scale.setScalar(0.12);
      innerCore.position.set(side, 0, -1.46);
      this.group.add(innerCore);

      this.flames.push(flame);
    }

    // Escudo esférico envolvente
    this.shieldBubbleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
    });
    this.shieldBubble = new THREE.Mesh(GEO.sphere, this.shieldBubbleMat);
    this.shieldBubble.scale.set(1.75, 0.95, 1.9);
    this.group.add(this.shieldBubble);

    // Escala destacada para verse espectacular en la vista panorámica
    this.group.scale.setScalar(1.22);

    scene.add(this.group);
    this.group.position.set(0, 0, CONFIG.playerZ);

    this.maxHp = CONFIG.playerMaxHp;
    this.hp = this.maxHp;
    this.maxShield = CONFIG.playerMaxShield;
    this.shield = 30;
    this.weapon = 1;
    this.fireCooldown = 0;
    this.boostTimer = 0;
    this.invuln = 0;
    this.alive = true;
    this.radius = 0.95;
    this._smoothRoll = 0;
    this._smoothPitch = 0;
  }

  reset() {
    this.group.position.set(0, 0, CONFIG.playerZ);
    this.group.rotation.set(0, 0, 0);
    this.group.visible = true;
    this.hp = this.maxHp;
    this.shield = 30;
    this.weapon = 1;
    this.fireCooldown = 0;
    this.boostTimer = 0;
    this.invuln = 0;
    this.alive = true;
    this._smoothRoll = 0;
    this._smoothPitch = 0;
  }

  update(dt, input) {
    if (!this.alive) return;
    const isBoosting = input.boost || this.boostTimer > 0;
    const speed = CONFIG.playerSpeed * (isBoosting ? CONFIG.boostMult : 1);

    let mx = input.mx;
    let my = input.my;
    if (input.mouseMoveX || input.mouseMoveY) {
      mx += (input.mouseMoveX || 0) * 0.02 * (this.settings?.mouseSens || 1.5);
      my += (input.mouseMoveY || 0) * 0.02 * (this.settings?.mouseSens || 1.5);
    }
    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }

    // IMPORTANTE: Como la cámara está en -Z mirando hacia +Z, +X es la IZQUIERDA en pantalla y -X es la DERECHA en pantalla.
    // Por eso restamos mx en X para que presionar Derecha (mx > 0) mueva el avión a la DERECHA de la pantalla,
    // y presionar Izquierda (mx < 0) mueva el avión a la IZQUIERDA de la pantalla.
    this.group.position.x -= mx * speed * dt;
    this.group.position.y -= my * speed * dt;
    this.group.position.x = Math.max(-CONFIG.boundsX, Math.min(CONFIG.boundsX, this.group.position.x));
    this.group.position.y = Math.max(-CONFIG.boundsY, Math.min(CONFIG.boundsY, this.group.position.y));

    // Inclinación aerodinámica coherente con la dirección en pantalla
    const targetRoll = mx * 0.55;
    const targetPitch = my * 0.32;
    this._smoothRoll += (targetRoll - this._smoothRoll) * Math.min(1, dt * 10);
    this._smoothPitch += (targetPitch - this._smoothPitch) * Math.min(1, dt * 10);

    this.group.rotation.z = this._smoothRoll;
    this.group.rotation.x = this._smoothPitch;
    this.group.rotation.y = -mx * 0.14;

    // Deflexión realista de alerones
    this.aileronL.rotation.x = this._smoothPitch * 1.4 + this._smoothRoll * 0.8;
    this.aileronR.rotation.x = this._smoothPitch * 1.4 - this._smoothRoll * 0.8;

    // Animación de postcombustión
    const pulse = 1 + Math.sin(performance.now() * 0.035) * 0.22;
    const boostScale = isBoosting ? 1.85 : 1.0;
    this.flameMat.color.setHex(isBoosting ? 0xff7b00 : 0x00f5d4);
    for (const f of this.flames) {
      f.scale.set(0.18 * pulse, 0.8 * boostScale * pulse, 0.18 * pulse);
      f.position.z = -1.55 - 0.22 * boostScale;
    }

    // El avión NUNCA desaparece al recibir daño; en su lugar destella el escudo
    this.group.visible = true;
    if (this.invuln > 0) {
      this.invuln -= dt;
      this.shieldBubbleMat.color.setHex(0xffbe0b);
      this.shieldBubbleMat.opacity = 0.35;
    } else if (this.shield > 0) {
      this.shieldBubbleMat.color.setHex(0x38bdf8);
      this.shieldBubbleMat.opacity = 0.08 + (this.shield / this.maxShield) * 0.14;
      this.shieldBubble.rotation.y += dt * 0.8;
    } else {
      this.shieldBubbleMat.opacity = 0;
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.boostTimer > 0) this.boostTimer -= dt;
  }

  canFire() {
    return this.fireCooldown <= 0;
  }

  onFire() {
    this.fireCooldown = CONFIG.fireRate / (this.weapon >= 2 ? 1.32 : 1) / (this.boostTimer > 0 ? 1.25 : 1);
  }

  takeDamage(amount) {
    if (this.invuln > 0) return false;
    if (this.shield > 0) {
      if (amount <= this.shield) {
        this.shield -= amount;
        this.invuln = 0.25;
        return true;
      }
      amount -= this.shield;
      this.shield = 0;
    }
    this.hp -= amount;
    this.invuln = 0.65;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return true;
  }

  addShield(v) {
    this.shield = Math.min(this.maxShield, this.shield + v);
  }

  heal(v) {
    this.hp = Math.min(this.maxHp, this.hp + v);
  }
}

// ---------- Bullet & Pool ----------
export class Bullet {
  constructor(scene, isPlayer = true) {
    this.scene = scene;
    this.isPlayer = isPlayer;
    this.mesh = new THREE.Group();

    const core = new THREE.Mesh(GEO.cyl, isPlayer ? MAT.playerBulletCore : MAT.enemyBulletCore);
    core.scale.set(0.07, isPlayer ? 0.9 : 0.7, 0.07);
    core.rotation.x = Math.PI / 2;
    this.mesh.add(core);

    const glow = new THREE.Mesh(GEO.cyl, isPlayer ? MAT.playerBulletGlow : MAT.enemyBulletGlow);
    glow.scale.set(0.15, isPlayer ? 1.0 : 0.8, 0.15);
    glow.rotation.x = Math.PI / 2;
    this.mesh.add(glow);

    this.mesh.visible = false;
    scene.add(this.mesh);
    this.active = false;
    this.velocity = new THREE.Vector3();
    this.damage = isPlayer ? 22 : 14;
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
    if (
      this.life <= 0 ||
      this.mesh.position.z > CONFIG.spawnZ + 12 ||
      this.mesh.position.z < CONFIG.despawnZ - 10
    ) {
      this.deactivate();
    }
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

export class BulletPool {
  constructor(scene, size, isPlayer) {
    this.pool = [];
    for (let i = 0; i < size; i++) this.pool.push(new Bullet(scene, isPlayer));
  }
  get() {
    let b = this.pool.find(x => !x.active);
    if (!b) {
      b = this.pool[0];
      b.deactivate();
    }
    return b;
  }
  update(dt) {
    for (const b of this.pool) if (b.active) b.update(dt);
  }
  active() {
    return this.pool.filter(b => b.active);
  }
}

// ---------- Enemy & Zero-Lag Pool ----------
export class Enemy {
  constructor(scene) {
    this.scene = scene;
    this.type = 'fighter';
    this.group = new THREE.Group();
    this.variants = {};
    this._buildAllVariants();
    this.group.visible = false;
    scene.add(this.group);

    this.active = false;
    this.hp = 1;
    this.maxHp = 1;
    this.speed = CONFIG.baseSpeed * 0.6;
    this.fireCooldown = 1;
    this.scoreValue = CONFIG.scorePerKill;
    this.radius = 0.85;
    this.phase = 0;
    this.velocity = new THREE.Vector3();
    this.pattern = 'straight';
    this._baseX = undefined;
  }

  _buildAllVariants() {
    const fighter = new THREE.Group();
    const fBody = new THREE.Mesh(GEO.box, MAT.enemyFighter);
    fBody.scale.set(0.85, 0.38, 1.65);
    fighter.add(fBody);
    const fWing = new THREE.Mesh(GEO.box, MAT.enemyWing);
    fWing.scale.set(2.3, 0.08, 0.65);
    fighter.add(fWing);
    const fNose = new THREE.Mesh(GEO.cone, MAT.enemyFighter);
    fNose.scale.set(0.35, 0.7, 0.35);
    fNose.rotation.x = -Math.PI / 2;
    fNose.position.z = -1.0;
    fighter.add(fNose);
    this.variants.fighter = fighter;
    this.group.add(fighter);

    const bomber = new THREE.Group();
    const bBody = new THREE.Mesh(GEO.box, MAT.enemyBomber);
    bBody.scale.set(1.45, 0.68, 2.2);
    bomber.add(bBody);
    const bWing = new THREE.Mesh(GEO.box, MAT.enemyWing);
    bWing.scale.set(3.1, 0.14, 0.9);
    bomber.add(bWing);
    this.variants.bomber = bomber;
    this.group.add(bomber);

    const kami = new THREE.Group();
    const kBody = new THREE.Mesh(GEO.octa, MAT.enemyKamikaze);
    kBody.scale.set(0.65, 0.45, 1.3);
    kami.add(kBody);
    const kRing = new THREE.Mesh(GEO.torus, MAT.enemyKamikaze);
    kRing.scale.setScalar(0.65);
    kami.add(kRing);
    this.variants.kamikaze = kami;
    this.group.add(kami);

    const blocker = new THREE.Group();
    const wall = new THREE.Mesh(GEO.box, MAT.enemyBlocker);
    wall.scale.set(5.4, 2.3, 0.55);
    blocker.add(wall);
    this.variants.blocker = blocker;
    this.group.add(blocker);
  }

  spawn(x, y, z, type, difficulty = 1) {
    this.type = type;
    for (const k of Object.keys(this.variants)) {
      this.variants[k].visible = k === type;
    }
    if (!this.variants[type]) this.variants.fighter.visible = true;

    this.group.position.set(x, y, z);
    this.group.rotation.set(0, 0, 0);
    this.active = true;
    this.group.visible = true;
    this.phase = Math.random() * Math.PI * 2;
    this._baseX = x;

    if (type === 'fighter') {
      this.hp = 20 + (difficulty - 1) * 12;
      this.maxHp = this.hp;
      this.speed = CONFIG.baseSpeed * 0.68 * Math.min(1.75, difficulty);
      this.fireCooldown = 1.35 / Math.min(1.9, difficulty);
      this.scoreValue = 60;
      this.radius = 0.85;
      this.pattern = 'sine';
    } else if (type === 'bomber') {
      this.hp = 60 + (difficulty - 1) * 28;
      this.maxHp = this.hp;
      this.speed = CONFIG.baseSpeed * 0.45 * Math.min(1.45, difficulty);
      this.fireCooldown = 1.7 / Math.min(1.7, difficulty);
      this.scoreValue = 140;
      this.radius = 1.25;
      this.pattern = 'straight';
    } else if (type === 'kamikaze') {
      this.hp = 20 + (difficulty - 1) * 10;
      this.maxHp = this.hp;
      this.speed = CONFIG.baseSpeed * 1.1 * Math.min(1.8, difficulty);
      this.fireCooldown = 99;
      this.scoreValue = 80;
      this.radius = 0.72;
      this.pattern = 'chase';
    } else if (type === 'blocker') {
      this.hp = 180 + difficulty * 60;
      this.maxHp = this.hp;
      this.speed = CONFIG.baseSpeed * 0.3;
      this.fireCooldown = 99;
      this.scoreValue = 220;
      this.radius = 1.7;
      this.pattern = 'straight';
    }
    this.velocity.set(0, 0, -this.speed);
  }

  update(dt, playerPos) {
    if (!this.active) return;
    const t = performance.now() * 0.001;
    const p = this.group.position;
    p.z += this.velocity.z * dt;

    if (this.pattern === 'sine') {
      p.x = this._baseX + Math.sin(t * 2.2 + this.phase) * 2.5;
      this.group.rotation.z = Math.cos(t * 2.2 + this.phase) * 0.35;
    } else if (this.pattern === 'chase') {
      const dx = playerPos.x - p.x;
      const dy = playerPos.y - p.y;
      p.x += dx * 1.6 * dt;
      p.y += dy * 1.6 * dt;
      this.group.rotation.z += dt * 4;
    }

    this.fireCooldown -= dt;
    if (p.z < CONFIG.despawnZ) this.deactivate();
  }

  canFire() {
    return this.fireCooldown <= 0;
  }

  onFire() {
    if (this.type === 'fighter') this.fireCooldown = 1.45;
    else if (this.type === 'bomber') this.fireCooldown = 1.95;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.deactivate();
      return true;
    }
    return false;
  }

  deactivate() {
    this.active = false;
    this.group.visible = false;
    this._baseX = undefined;
  }
}

export class EnemyPool {
  constructor(scene, size) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < size; i++) this.pool.push(new Enemy(scene));
  }
  get() {
    let e = this.pool.find(x => !x.active);
    if (!e) {
      e = new Enemy(this.scene);
      this.pool.push(e);
    }
    return e;
  }
  update(dt, playerPos) {
    for (const e of this.pool) if (e.active) e.update(dt, playerPos);
  }
  active() {
    return this.pool.filter(e => e.active);
  }
}

// ---------- Obstacles & Thematic Pedagogical Artifacts ----------
export class Obstacle {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.variants = {};
    this._buildVariants();
    this.mesh.visible = false;
    scene.add(this.mesh);

    this.active = false;
    this.kind = 'asteroid';
    this.hp = 30;
    this.destructible = true;
    this.radius = 1;
    this.scoreValue = CONFIG.scorePerObstacle;
    this.rotSpeed = new THREE.Vector3();
  }

  _buildVariants() {
    const ast = new THREE.Mesh(GEO.icosa, MAT.asteroid);
    this.variants.asteroid = ast;
    this.mesh.add(ast);

    const deb = new THREE.Mesh(GEO.box, MAT.debris);
    deb.scale.set(1.3, 0.45, 1.3);
    this.variants.debris = deb;
    this.mesh.add(deb);

    const pil = new THREE.Mesh(GEO.cyl, MAT.pillar);
    pil.scale.set(0.68, 6.5, 0.68);
    this.variants.pillar = pil;
    this.mesh.add(pil);

    const ard = new THREE.Group();
    const pcb = new THREE.Mesh(GEO.box, MAT.arduinoPcb);
    pcb.scale.set(1.7, 0.16, 1.2);
    ard.add(pcb);
    const chip = new THREE.Mesh(GEO.box, MAT.arduinoChip);
    chip.scale.set(0.8, 0.24, 0.4);
    chip.position.y = 0.12;
    ard.add(chip);
    const pinBar = new THREE.Mesh(GEO.box, MAT.goldPin);
    pinBar.scale.set(1.4, 0.22, 0.12);
    pinBar.position.set(0, 0.12, 0.48);
    ard.add(pinBar);
    this.variants.arduino = ard;
    this.mesh.add(ard);

    const p3d = new THREE.Mesh(GEO.torus, MAT.print3dMat);
    p3d.scale.setScalar(0.95);
    this.variants.print3d = p3d;
    this.mesh.add(p3d);

    const iot = new THREE.Group();
    const core = new THREE.Mesh(GEO.octa, MAT.iotNodeMat);
    core.scale.setScalar(0.75);
    iot.add(core);
    const ring = new THREE.Mesh(GEO.torus, MAT.hullAccent);
    ring.scale.setScalar(1.1);
    ring.rotation.x = Math.PI / 3;
    iot.add(ring);
    this.variants.iot_node = iot;
    this.mesh.add(iot);

    const codeB = new THREE.Mesh(GEO.octa, MAT.codeBlockMat);
    codeB.scale.setScalar(0.95);
    this.variants.code_block = codeB;
    this.mesh.add(codeB);
  }

  spawn(x, y, z, kind) {
    this.kind = kind;
    this.active = true;
    this.mesh.visible = true;

    for (const k of Object.keys(this.variants)) {
      this.variants[k].visible = k === kind;
    }
    if (!this.variants[kind]) this.variants.asteroid.visible = true;

    if (kind === 'asteroid') {
      const r = 0.75 + Math.random() * 0.85;
      this.variants.asteroid.scale.setScalar(r);
      this.radius = r;
      this.hp = Math.ceil(r * 35);
      this.destructible = true;
      this.rotSpeed.set(Math.random() * 1.8, Math.random() * 1.8, Math.random() * 1.8);
    } else if (kind === 'pillar') {
      this.radius = 0.85;
      this.hp = 9999;
      this.destructible = false;
      this.rotSpeed.set(0, 0.5, 0);
    } else {
      this.radius = 1.0;
      this.hp = 40;
      this.destructible = true;
      this.rotSpeed.set(0.8, 1.4, 0.6);
    }

    this.mesh.position.set(x, y, z);
    this.mesh.rotation.set(0, 0, 0);
  }

  updateWithSpeed(dt, speed) {
    if (!this.active) return;
    this.mesh.position.z -= speed * dt;
    if (this.kind !== 'pillar') {
      this.mesh.rotation.x += this.rotSpeed.x * dt;
      this.mesh.rotation.y += this.rotSpeed.y * dt;
      this.mesh.rotation.z += this.rotSpeed.z * dt;
    }
    if (this.mesh.position.z < CONFIG.despawnZ) this.deactivate();
  }

  takeDamage(amount) {
    if (!this.destructible) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.deactivate();
      return true;
    }
    return false;
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

export class ObstaclePool {
  constructor(scene, size) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < size; i++) this.pool.push(new Obstacle(scene));
  }
  get() {
    let o = this.pool.find(x => !x.active);
    if (!o) {
      o = new Obstacle(this.scene);
      this.pool.push(o);
    }
    return o;
  }
  update(dt, speed) {
    for (const o of this.pool) if (o.active) o.updateWithSpeed(dt, speed);
  }
  active() {
    return this.pool.filter(o => o.active);
  }
}

// ---------- PowerUp & Pool ----------
export class PowerUp {
  constructor(scene) {
    this.scene = scene;
    this.mat = new THREE.MeshStandardMaterial({ color: 0x4cc9f0, emissive: 0x4cc9f0, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.2 });
    this.mesh = new THREE.Mesh(GEO.octa, this.mat);
    this.mesh.scale.setScalar(0.68);
    const ring = new THREE.Mesh(GEO.torus, MAT.playerBulletCore);
    ring.scale.setScalar(0.85);
    this.mesh.add(ring);
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.active = false;
    this.type = 'shield';
    this.radius = 0.95;
  }

  spawn(x, y, z, type) {
    this.type = type;
    this.active = true;
    const color =
      type === 'shield' ? 0x4cc9f0 :
      type === 'health' ? 0x70e000 :
      type === 'double' ? 0xfff176 :
      type === 'triple' ? 0xff006e :
      0xffa500;
    this.mat.color.setHex(color);
    this.mat.emissive.setHex(color);
    this.mesh.position.set(x, y, z);
    this.mesh.visible = true;
  }

  update(dt, speed) {
    if (!this.active) return;
    this.mesh.position.z -= speed * dt;
    this.mesh.rotation.y += 2.2 * dt;
    this.mesh.rotation.x += 1.1 * dt;
    if (this.mesh.position.z < CONFIG.despawnZ) this.deactivate();
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}

export class PowerUpPool {
  constructor(scene, size) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < size; i++) this.pool.push(new PowerUp(scene));
  }
  get() {
    let p = this.pool.find(x => !x.active);
    if (!p) {
      p = new PowerUp(this.scene);
      this.pool.push(p);
    }
    return p;
  }
  update(dt, speed) {
    for (const p of this.pool) if (p.active) p.update(dt, speed);
  }
  active() {
    return this.pool.filter(p => p.active);
  }
}

// ---------- Sistema de 2 Fases con Tarjetas Holográficas (1: Tarjeta de Pregunta -> 2: Tarjetas de Opciones) ----------
export class GateManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this.active = false;
    this.phase = 'idle'; // 'idle' | 'question_card' | 'option_cards'
    this.resolved = false;
    this.challenge = null;

    // --- FASE 1: Tarjeta 3D de Pregunta (Question Card) ---
    this.qCardGroup = new THREE.Group();
    this.qFrameMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.2,
    });
    this.qBgMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });

    const qW = 6.6;
    const qH = 4.2;
    const qLeft = new THREE.Mesh(GEO.box, this.qFrameMat);
    qLeft.scale.set(0.24, qH, 0.28);
    qLeft.position.set(-qW / 2, 0, 0);
    const qRight = new THREE.Mesh(GEO.box, this.qFrameMat);
    qRight.scale.set(0.24, qH, 0.28);
    qRight.position.set(qW / 2, 0, 0);
    const qTop = new THREE.Mesh(GEO.box, this.qFrameMat);
    qTop.scale.set(qW + 0.25, 0.26, 0.28);
    qTop.position.set(0, qH / 2, 0);
    const qBot = new THREE.Mesh(GEO.box, this.qFrameMat);
    qBot.scale.set(qW + 0.25, 0.24, 0.28);
    qBot.position.set(0, -qH / 2, 0);
    const qField = new THREE.Mesh(GEO.plane, this.qBgMat);
    qField.scale.set(qW, qH, 1);

    this.qCanvas = document.createElement('canvas');
    this.qCanvas.width = 768;
    this.qCanvas.height = 384;
    this.qCtx = this.qCanvas.getContext('2d');
    this.qTexture = new THREE.CanvasTexture(this.qCanvas);
    this.qTexture.minFilter = THREE.LinearFilter;
    const qSpriteMat = new THREE.SpriteMaterial({ map: this.qTexture, transparent: true });
    this.qSprite = new THREE.Sprite(qSpriteMat);
    this.qSprite.scale.set(6.2, 3.1, 1);
    this.qSprite.position.set(0, 0.1, 0.25);

    this.qCardGroup.add(qLeft, qRight, qTop, qBot, qField, this.qSprite);
    this.group.add(this.qCardGroup);

    // --- FASE 2: Tarjetas 3D de Opciones (Option Cards) ---
    this.optionsGroup = new THREE.Group();
    this.group.add(this.optionsGroup);
    this.gates = [];

    for (let i = 0; i < 4; i++) {
      const gateGroup = new THREE.Group();

      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.75,
        metalness: 0.7,
        roughness: 0.2,
      });

      const fieldMat = new THREE.MeshBasicMaterial({
        color: 0x00f5d4,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });

      const leftPillar = new THREE.Mesh(GEO.box, frameMat);
      const rightPillar = new THREE.Mesh(GEO.box, frameMat);
      const topBar = new THREE.Mesh(GEO.box, frameMat);
      const bottomBar = new THREE.Mesh(GEO.box, frameMat);
      const energyField = new THREE.Mesh(GEO.plane, fieldMat);

      gateGroup.add(leftPillar, rightPillar, topBar, bottomBar, energyField);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const labelSprite = new THREE.Sprite(labelMat);
      labelSprite.position.set(0, 0.15, 0.25);
      gateGroup.add(labelSprite);

      this.optionsGroup.add(gateGroup);
      this.gates.push({
        group: gateGroup,
        leftPillar,
        rightPillar,
        topBar,
        bottomBar,
        energyField,
        frameMat,
        fieldMat,
        canvas,
        ctx,
        texture,
        labelSprite,
        centerX: 0,
        option: null,
      });
    }
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, startY + i * lineHeight);
    }
  }

  _drawQuestionCard(challenge) {
    const ctx = this.qCtx;
    const w = this.qCanvas.width;
    const h = this.qCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Fondo estilo Tarjeta Dorada/Cyber
    ctx.fillStyle = 'rgba(8, 16, 38, 0.95)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(12, 12, w - 24, h - 24, 28);
    ctx.fill();
    ctx.stroke();

    // Encabezado de la tarjeta
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🃏 TARJETA DE PREGUNTA — ¡PASA POR AQUÍ!', w / 2, 58);

    // Texto grande de la pregunta
    ctx.fillStyle = '#ffffff';
    const qLen = challenge.question.length;
    const fSize = qLen > 42 ? 36 : qLen > 26 ? 42 : 52;
    ctx.font = `bold ${fSize}px "Segoe UI", system-ui, sans-serif`;
    this._wrapText(ctx, challenge.question, w / 2, 195, w - 70, fSize + 10);

    // Pie de instrucción
    ctx.fillStyle = '#00f5d4';
    ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('✈️ Cruza esta tarjeta si sabes la respuesta', w / 2, 336);

    this.qTexture.needsUpdate = true;
  }

  _drawOptionCard(gate, index, text, accentHex) {
    const { ctx, canvas, texture } = gate;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const letters = ['A', 'B', 'C', 'D'];
    ctx.fillStyle = 'rgba(6, 15, 34, 0.94)';
    ctx.strokeStyle = accentHex || '#00f5d4';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentHex || '#00f5d4';
    ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`TARJETA ${letters[index] || index + 1}`, canvas.width / 2, 56);

    ctx.fillStyle = '#ffffff';
    const fontSize = text.length > 16 ? 34 : text.length > 10 ? 42 : 56;
    ctx.font = `bold ${fontSize}px "Consolas", "Segoe UI", sans-serif`;
    this._wrapText(ctx, text, canvas.width / 2, 155, canvas.width - 44, fontSize + 8);

    texture.needsUpdate = true;
  }

  // Paso 1: Aparece la Tarjeta de Pregunta en el centro
  spawn(z, challenge) {
    this.challenge = challenge;
    this.active = true;
    this.phase = 'question_card';
    this.resolved = false;

    this.group.position.set(0, 0, z);
    this.group.visible = true;

    this.qCardGroup.visible = true;
    this.optionsGroup.visible = false;
    this.qFrameMat.color.setHex(0xfbbf24);
    this.qFrameMat.emissive.setHex(0xd97706);
    this.qBgMat.color.setHex(0xfbbf24);
    this.qBgMat.opacity = 0.18;

    this._drawQuestionCard(challenge);
  }

  // Paso 2: Cuando el jugador cruza la Tarjeta de Pregunta, se despliegan las Tarjetas de Opciones al frente
  deployOptionCards(z) {
    this.phase = 'option_cards';
    this.resolved = false;
    this.group.position.set(0, 0, z);
    this.qCardGroup.visible = false;
    this.optionsGroup.visible = true;

    const n = this.challenge.options.length;
    const totalWidth = CONFIG.boundsX * 1.95;
    const laneWidth = totalWidth / n;
    const gateWidth = laneWidth * 0.86;
    const gateHeight = CONFIG.boundsY * 1.65;
    const accentHex = this.challenge.stage?.accentHex || '#00f5d4';
    const accentColor = this.challenge.stage?.gridColor || 0x00f5d4;

    for (let i = 0; i < 4; i++) {
      const g = this.gates[i];
      if (i >= n) {
        g.group.visible = false;
        continue;
      }
      g.group.visible = true;
      const opt = this.challenge.options[i];
      g.option = opt;

      // En nuestra cámara (+X = izquierda de pantalla, -X = derecha de pantalla),
      // colocamos TARJETA A a la izquierda (+X) y TARJETA B/C/D hacia la derecha (-X).
      const centerX = CONFIG.boundsX * 0.975 - laneWidth * (i + 0.5);
      g.centerX = centerX;
      g.group.position.set(centerX, 0.2, 0);

      g.frameMat.color.setHex(accentColor);
      g.frameMat.emissive.setHex(accentColor);
      g.fieldMat.color.setHex(accentColor);
      g.fieldMat.opacity = 0.22;

      g.leftPillar.scale.set(0.2, gateHeight, 0.25);
      g.leftPillar.position.set(-gateWidth / 2, 0, 0);

      g.rightPillar.scale.set(0.2, gateHeight, 0.25);
      g.rightPillar.position.set(gateWidth / 2, 0, 0);

      g.topBar.scale.set(gateWidth + 0.2, 0.24, 0.25);
      g.topBar.position.set(0, gateHeight / 2, 0);

      g.bottomBar.scale.set(gateWidth + 0.2, 0.2, 0.25);
      g.bottomBar.position.set(0, -gateHeight / 2, 0);

      g.energyField.scale.set(gateWidth, gateHeight, 1);
      g.labelSprite.scale.set(Math.min(4.8, gateWidth * 0.94), 2.35, 1);

      this._drawOptionCard(g, i, opt.text, accentHex);
    }
  }

  update(dt, playerPos, onQuestionActivated, onOptionResolved, onSkipped) {
    if (!this.active) return;

    if (this.phase === 'question_card') {
      // La Tarjeta de Pregunta avanza despacio para dar mucho tiempo de lectura
      this.group.position.z -= CONFIG.questionCardSpeed * dt;

      if (!this.resolved && this.group.position.z <= CONFIG.playerZ + 1.2 && this.group.position.z >= CONFIG.playerZ - 2.5) {
        // ¿El jugador pasó por dentro de la Tarjeta de Pregunta? (ancho generoso +-3.8)
        if (Math.abs(playerPos.x) <= 3.8 && Math.abs(playerPos.y) <= 2.9) {
          this.resolved = true;
          this.qFrameMat.color.setHex(0x00f5d4);
          this.qBgMat.opacity = 0.45;
          // Desplegar las opciones lejos al frente (z = 76) para dar ~9 segundos de respuesta
          this.deployOptionCards(CONFIG.spawnZ - 4);
          if (onQuestionActivated) onQuestionActivated(this.challenge);
          return;
        }
      }

      if (this.group.position.z < CONFIG.despawnZ) {
        this.deactivate();
        if (onSkipped) onSkipped();
      }
    } else if (this.phase === 'option_cards') {
      // Las Tarjetas de Opciones avanzan aún más suave para que los niños elijan con calma
      this.group.position.z -= CONFIG.optionsCardSpeed * dt;

      if (!this.resolved && this.group.position.z <= CONFIG.playerZ + 1.0 && this.group.position.z >= CONFIG.playerZ - 2.5) {
        this.resolved = true;
        const n = this.challenge.options.length;
        let chosenGate = this.gates[0];
        let minDist = Infinity;
        for (let i = 0; i < n; i++) {
          const g = this.gates[i];
          const d = Math.abs(playerPos.x - g.centerX);
          if (d < minDist) {
            minDist = d;
            chosenGate = g;
          }
        }

        const isCorrect = !!(chosenGate && chosenGate.option && chosenGate.option.isCorrect);
        if (chosenGate) {
          const feedbackColor = isCorrect ? 0x10b981 : 0xff2a55;
          chosenGate.frameMat.color.setHex(feedbackColor);
          chosenGate.frameMat.emissive.setHex(feedbackColor);
          chosenGate.fieldMat.color.setHex(feedbackColor);
          chosenGate.fieldMat.opacity = 0.5;
        }

        if (onOptionResolved) onOptionResolved(isCorrect, this.challenge, chosenGate.centerX);
      }

      if (this.group.position.z < CONFIG.despawnZ) {
        this.deactivate();
      }
    }
  }

  deactivate() {
    this.active = false;
    this.phase = 'idle';
    this.resolved = false;
    this.group.visible = false;
  }
}

// ---------- Sistema de Partículas Pre-Alocado (Zero-Lag) ----------
export class ParticleSystem {
  constructor(scene, poolSize = 180) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < poolSize; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const m = new THREE.Mesh(GEO.lowSphere, mat);
      m.scale.setScalar(0.14);
      m.visible = false;
      scene.add(m);
      this.pool.push({
        mesh: m,
        mat,
        vel: new THREE.Vector3(),
        life: 0,
        active: false,
      });
    }
  }

  burst(pos, color, count = 14, speed = 6) {
    let spawned = 0;
    for (let i = 0; i < this.pool.length && spawned < count; i++) {
      const p = this.pool[i];
      if (p.active) continue;
      p.active = true;
      p.life = 0.55 + Math.random() * 0.35;
      p.mat.color.setHex(color);
      p.mesh.position.copy(pos);
      p.mesh.scale.setScalar(0.16);
      p.mesh.visible = true;
      p.vel
        .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .normalize()
        .multiplyScalar(speed * (0.45 + Math.random() * 0.75));
      spawned++;
    }
  }

  update(dt) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(0.93);
      p.mesh.scale.setScalar(Math.max(0.02, p.life * 0.24));
    }
  }
}

// ---------- Jefe Evolutivo ("El Villano") con Escalado Temporal (Overclock) ----------
export class Boss {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x9d4edd,
      emissive: 0x7b2cbf,
      emissiveIntensity: 0.65,
      metalness: 0.7,
      roughness: 0.2,
    });
    const core = new THREE.Mesh(GEO.sphere, this.coreMat);
    core.scale.setScalar(2.15);
    this.group.add(core);

    this.ringMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, wireframe: true });
    this.gyroRing1 = new THREE.Mesh(GEO.torus, this.ringMat);
    this.gyroRing1.scale.setScalar(2.9);
    this.group.add(this.gyroRing1);

    this.gyroRing2 = new THREE.Mesh(GEO.torus, this.ringMat);
    this.gyroRing2.scale.setScalar(3.3);
    this.gyroRing2.rotation.x = Math.PI / 2;
    this.group.add(this.gyroRing2);

    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.85, roughness: 0.25 });
    const wing = new THREE.Mesh(GEO.box, wingMat);
    wing.scale.set(7.8, 0.45, 2.2);
    this.group.add(wing);

    for (let i = -1; i <= 1; i++) {
      const t = new THREE.Mesh(GEO.cyl, MAT.enemyFighter);
      t.scale.set(0.32, 1.3, 0.32);
      t.rotation.x = Math.PI / 2;
      t.position.set(i * 2.3, -0.1, 1.6);
      this.group.add(t);
    }

    this.group.visible = false;
    scene.add(this.group);

    this.active = false;
    this.maxHp = 240;
    this.hp = this.maxHp;
    this.radius = 2.75;
    this.scoreValue = 1200;
    this.phase = 0;
    this.combatTime = 0;
    this.enragePhase = 1;
    this.speedMultiplier = 1.0;
    this.difficulty = 1;
    this.fireCooldown = 1.4;
    this.name = 'GLITCH OVERLORD';
  }

  spawn(z, difficulty = 1, bossName = 'GLITCH OVERLORD') {
    this.group.position.set(0, 1.2, z);
    this.active = true;
    this.group.visible = true;
    this.difficulty = difficulty;
    this.name = bossName;
    this.maxHp = Math.round(220 + difficulty * 95);
    this.hp = this.maxHp;
    this.combatTime = 0;
    this.enragePhase = 1;
    this.speedMultiplier = 1.0;
    this.fireCooldown = 1.3;
    this.phase = 0;
    this.coreMat.color.setHex(0x9d4edd);
    this.coreMat.emissive.setHex(0x7b2cbf);
    this.ringMat.color.setHex(0x00f5d4);
  }

  update(dt, playerPos, worldSpeed) {
    if (!this.active) return;
    this.combatTime += dt;

    const levelBoost = 1 + (this.difficulty - 1) * 0.22;
    const timeBoost = 1 + Math.min(1.35, this.combatTime * 0.04);
    this.speedMultiplier = levelBoost * timeBoost;

    const prevPhase = this.enragePhase;
    if (this.combatTime >= 22) {
      this.enragePhase = 3;
      this.coreMat.color.setHex(0xff0055);
      this.coreMat.emissive.setHex(0xd90429);
      this.ringMat.color.setHex(0xffbe0b);
    } else if (this.combatTime >= 11) {
      this.enragePhase = 2;
      this.coreMat.color.setHex(0xff7b00);
      this.coreMat.emissive.setHex(0xea580c);
      this.ringMat.color.setHex(0xff7b00);
    } else {
      this.enragePhase = 1;
    }
    this.justChangedPhase = this.enragePhase !== prevPhase;

    if (this.group.position.z > 22) {
      this.group.position.z -= worldSpeed * 0.65 * dt;
      if (this.group.position.z < 22) this.group.position.z = 22;
    }

    this.phase += dt * this.speedMultiplier;
    const swingX = this.enragePhase === 3 ? 5.5 : 4.2;
    this.group.position.x = Math.sin(this.phase * 0.9) * swingX;
    this.group.position.y = 0.8 + Math.sin(this.phase * 1.4) * 1.6;

    this.gyroRing1.rotation.z += dt * 1.8 * this.speedMultiplier;
    this.gyroRing1.rotation.x += dt * 0.9 * this.speedMultiplier;
    this.gyroRing2.rotation.y -= dt * 2.2 * this.speedMultiplier;

    this.group.rotation.y = Math.atan2(
      playerPos.x - this.group.position.x,
      playerPos.z - this.group.position.z
    );

    this.fireCooldown -= dt * (0.85 + this.speedMultiplier * 0.32);
  }

  canFire() {
    return this.fireCooldown <= 0;
  }

  onFire() {
    this.fireCooldown = this.enragePhase === 3 ? 0.78 : this.enragePhase === 2 ? 0.98 : 1.25;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.deactivate();
      return true;
    }
    return false;
  }

  deactivate() {
    this.active = false;
    this.group.visible = false;
  }
}
