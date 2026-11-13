export const TOTAL = move => move ? move.startup + move.active + move.recover : 0;
export const causesKnockdown = (move, damage) => !!move && (move.kind === 'special' || move.id === 'heavy') && damage >= 14;

export function movementState(f, { blocking=false, horizontal=0, crouching=false }={}) {
  f.block=!!blocking;
  if (f.state==='attack'||f.hitstun>0||f.knockdown>0||f.recovery>0) { f.block=false; return f.state; }
  f.state=f.block?'block':crouching?'crouch':f.air?'jump':horizontal?'walk':'idle';
  return f.state;
}

export function interrupt(f, stun = 0, knockdown = 0) {
  f.buffered = null; f.used?.clear(); f.move = null; f.elapsed = 0;
  f.block = false; f.vx = 0; f.vy = knockdown ? -115 : f.vy;
  f.hitstun = stun; f.knockdown = knockdown; f.recovery = 0;
  f.air = !!knockdown; f.state = knockdown ? 'knockdown' : stun ? 'hit' : 'idle';
}

export function resetTransient(f, x) {
  Object.assign(f, { x, y:0, vx:0, vy:0, stamina:100, state:'idle', move:null,
    elapsed:0, hitstun:0, knockdown:0, recovery:0, buffered:null, block:false,
    air:false, used:new Set(), combo:0, comboTime:0, anim:0, landTimer:0, launched:false,
    specialHitCount:0 });
}

export function advanceState(f, dt) {
  f.anim += dt;
  if (f.state === 'landing') {
    f.landTimer = Math.max(0, (f.landTimer || 0) - dt);
    if (f.landTimer === 0) f.state = 'idle';
    return;
  }
  if (f.knockdown > 0) {
    f.knockdown = Math.max(0, f.knockdown - dt);
    f.x += f.vx * dt; f.vx *= .82;
    if (f.knockdown === 0) { f.recovery = .42; f.state = 'recovery'; f.vx = 0; f.vy = 0; f.y = 0; f.air = false; f.move = null; f.buffered = null; }
    return;
  }
  if (f.recovery > 0) {
    f.recovery = Math.max(0, f.recovery - dt);
    if (f.recovery === 0) f.state = 'idle';
    return;
  }
  if (f.hitstun > 0) {
    f.hitstun = Math.max(0, f.hitstun - dt); f.state = f.hitstun ? 'hit' : 'idle';
    f.x += f.vx * dt; f.vx *= .82;
  }
}

export function settleTournament(t, won) {
  if (!t.active || t.wins >= 3) return { accepted:false, bonus:0 };
  if (!won) { t.active=false; t.wins=0; return { accepted:true, bonus:0 }; }
  t.wins++;
  if (t.wins === 3) {
    const id = `tournament-${t.serial}`;
    const bonus = t.awarded.includes(id) ? 0 : 300;
    if (!t.awarded.includes(id)) t.awarded.push(id);
    t.active=false;
    return { accepted:true, bonus };
  }
  return { accepted:true, bonus:0 };
}
