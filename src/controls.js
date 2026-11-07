import { DEFAULT_BINDINGS } from './config.js?v=11';
export class InputManager {
  constructor(canvas, settings, bindings) {
    this.canvas = canvas;
    this.settings = settings || {};
    this.bindings = bindings ? JSON.parse(JSON.stringify(bindings)) : JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    this.keys = {};
    this.mouse = { x:0, y:0, down:false, dragging:false, lastX:0, lastY:0 };
    this.touch = { x:0, y:0, active:false, fire:false };
    this.stick = { x:0, y:0 };
    this.gamepadIndex = null;
    this.paused = false;
    this.firePressed = false;
    this.boost = false;
    this.mouseSens = this.settings.mouseSens || 1.5;

    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      const b = this.bindings;
      if (b.fire.includes(e.code)) { this.firePressed = true; e.preventDefault(); }
      if (b.boost.includes(e.code)) this.boost = true;
      if (b.pause.includes(e.code)) this.paused = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      const b = this.bindings;
      if (b.fire.includes(e.code)) this.firePressed = false;
      if (b.boost.includes(e.code)) this.boost = false;
    });

    canvas.addEventListener('mousedown', e => { this.mouse.down = true; this.mouse.dragging = true; this.mouse.lastX = e.clientX; this.mouse.lastY = e.clientY; this.firePressed = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; this.mouse.dragging = false; this.firePressed = false; });
    window.addEventListener('mousemove', e => {
      if (this.mouse.dragging) {
        const dx = (e.clientX - this.mouse.lastX) * 0.0015 * this.mouseSens * window.innerWidth;
        const dy = (e.clientY - this.mouse.lastY) * 0.0015 * this.mouseSens * window.innerHeight;
        // handled in game via delta; store raw delta
        this.mouse.dx = (this.mouse.dx||0) + (e.clientX - this.mouse.lastX);
        this.mouse.dy = (this.mouse.dy||0) + (e.clientY - this.mouse.lastY);
        this.mouse.lastX = e.clientX; this.mouse.lastY = e.clientY;
      }
    });
    canvas.addEventListener('click', () => { this.firePressed = true; setTimeout(()=>{ if(!this.mouse.down) this.firePressed=false; }, 80); });

    // touch stick
    const stickEl = document.getElementById('stick');
    const fireEl = document.getElementById('fireBtn');
    if (stickEl) {
      let stickStart = null;
      stickEl.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        stickStart = { x:t.clientX, y:t.clientY };
        this.touch.active = true;
        e.preventDefault();
      }, {passive:false});
      stickEl.addEventListener('touchmove', e => {
        if (!stickStart) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - stickStart.x;
        const dy = t.clientY - stickStart.y;
        const len = Math.hypot(dx,dy);
        const max = 40;
        const s = len > max ? max/len : 1;
        this.stick.x = (dx*s)/max;
        this.stick.y = (dy*s)/max;
        e.preventDefault();
      }, {passive:false});
      const endStick = () => { stickStart=null; this.touch.active=false; this.stick.x=0; this.stick.y=0; };
      stickEl.addEventListener('touchend', endStick);
      stickEl.addEventListener('touchcancel', endStick);
    }
    if (fireEl) {
      fireEl.addEventListener('touchstart', e => { this.touch.fire = true; this.firePressed = true; e.preventDefault(); }, {passive:false});
      const endFire = () => { this.touch.fire = false; this.firePressed = false; };
      fireEl.addEventListener('touchend', endFire);
      fireEl.addEventListener('touchcancel', endFire);
    }

    window.addEventListener('gamepadconnected', e => { this.gamepadIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepadIndex = null; });
  }

  setMouseSens(v) { this.mouseSens = v; }

  setBindings(b) {
    this.bindings = JSON.parse(JSON.stringify(b));
  }

  // Returns movement vector (x,y) in [-1,1] and fire boolean
  poll() {
    let mx = 0, my = 0;
    const b = this.bindings;
    // keyboard
    if (b.moveUp.some(k=>this.keys[k])) my -= 1;
    if (b.moveDown.some(k=>this.keys[k])) my += 1;
    if (b.moveLeft.some(k=>this.keys[k])) mx -= 1;
    if (b.moveRight.some(k=>this.keys[k])) mx += 1;
    // touch stick
    mx += this.stick.x;
    my += this.stick.y;
    // mouse drag delta -> movement
    const mdx = this.mouse.dx || 0;
    const mdy = this.mouse.dy || 0;
    this.mouse.dx = 0; this.mouse.dy = 0;
    // convert drag to movement impulse (handled by game scaling)
    this.mouseMoveX = mdx;
    this.mouseMoveY = mdy;

    // gamepad
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        mx += gp.axes[0] || 0;
        my += gp.axes[1] || 0;
        const rt = gp.buttons[7]?.value || gp.buttons[0]?.pressed;
        if (rt) this.firePressed = true;
        if (gp.buttons[5]?.pressed) this.boost = true;
        if (gp.buttons[9]?.pressed) this.paused = true;
      }
    }
    const len = Math.hypot(mx,my);
    if (len > 1) { mx/=len; my/=len; }
    return { mx, my, fire: this.firePressed, boost: this.boost, paused: this.paused };
  }

  consumePaused() { const p = this.paused; this.paused = false; return p; }
}
