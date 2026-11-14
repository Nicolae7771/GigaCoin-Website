const TOTAL = move => move ? move.startup + move.active + move.recover : 0;
const causesKnockdown = (move, damage) => !!move && (move.kind === 'special' || move.id === 'heavy') && damage >= 14;
function attackPhase(move, elapsed) {
  if(!move)return 'none';
  if(elapsed<move.startup)return 'startup';
  if(elapsed<=move.startup+move.active)return 'active';
  if(elapsed<move.startup+move.active+move.recover)return 'recovery';
  return 'complete';
}
const isAttackActive=(move,elapsed)=>attackPhase(move,elapsed)==='active';

const BODY_SHAPES = Object.freeze({
  giga_champion: { halfWidth:24, height:122 },
  viper_dash: { halfWidth:20, height:126 },
  volt_lucha: { halfWidth:22, height:124 },
  titan_rex: { halfWidth:27, height:138 },
  nova_blaze: { halfWidth:20, height:130 }
});

function bodyShape(f) { return BODY_SHAPES[f?.def?.id] || { halfWidth:23, height:124 }; }

function separateBodies(a, b, { passiveB=false, gap=2 }={}) {
  const dx=b.x-a.x, required=bodyShape(a).halfWidth+bodyShape(b).halfWidth+gap;
  const overlap=required-Math.abs(dx);
  if(overlap<=0)return 0;
  const direction=dx>=0?-1:1;
  if(passiveB)a.x+=direction*overlap;
  else {a.x+=direction*overlap/2;b.x-=direction*overlap/2;}
  return overlap;
}

function clampFighterX(f, min=78, max=882) {
  const half=bodyShape(f).halfWidth;
  f.x=Math.max(min+half,Math.min(max-half,f.x));
  return f.x;
}

function approachVelocity(f, input, dt, maxSpeed=f.def.move, acceleration=1250) {
  const target=input*maxSpeed, delta=target-f.vx, amount=(input===0?acceleration*.45:acceleration)*dt;
  f.vx+=Math.max(-amount,Math.min(amount,delta));
  return f.vx;
}

function updateFacing(f, other, threshold=5) {
  const dx=other.x-f.x;
  if(Math.abs(dx)>threshold)f.face=dx>0?1:-1;
  return f.face;
}

function movementState(f, { blocking=false, horizontal=0, crouching=false }={}) {
  f.block=!!blocking;
  if (f.state==='attack'||f.hitstun>0||f.knockdown>0||f.recovery>0) { f.block=false; return f.state; }
  f.state=f.block?'block':crouching?'crouch':f.air?'jump':horizontal?'walk':'idle';
  return f.state;
}

function interrupt(f, stun = 0, knockdown = 0) {
  f.buffered = null; f.used?.clear(); f.move = null; f.elapsed = 0;
  f.block = false; f.vx = 0; f.vy = knockdown ? -115 : f.vy;
  f.hitstun = stun; f.knockdown = knockdown; f.recovery = 0;
  f.air = !!knockdown; f.state = knockdown ? 'knockdown' : stun ? 'hit' : 'idle';
  f.animationAction = knockdown ? 'knockdown' : stun ? 'hit_reaction' : null;
  f.animationActionTimer = 0; f._crouchVisual = false;
}

function resetTransient(f, x) {
  Object.assign(f, { x, y:0, vx:0, vy:0, stamina:100, state:'idle', move:null,
    elapsed:0, hitstun:0, knockdown:0, recovery:0, buffered:null, block:false,
    air:false, used:new Set(), combo:0, comboTime:0, anim:0, landTimer:0, launched:false,
    specialHitCount:0, animationAction:null, animationActionTimer:0, _crouchVisual:false });
}

function advanceState(f, dt) {
  f.anim += dt;
  if (f.state === 'landing') {
    f.landTimer = Math.max(0, (f.landTimer || 0) - dt);
    if (f.landTimer === 0) { f.state = 'idle'; f.animationAction = null; }
    return;
  }
  if (f.knockdown > 0) {
    f.knockdown = Math.max(0, f.knockdown - dt);
    f.x += f.vx * dt; f.vx *= .82;
    if (f.knockdown === 0) { f.recovery = .42; f.state = 'recovery'; f.animationAction = 'recovery'; f.animationActionTimer = .42; f.vx = 0; f.vy = 0; f.y = 0; f.air = false; f.move = null; f.buffered = null; }
    return;
  }
  if (f.recovery > 0) {
    f.recovery = Math.max(0, f.recovery - dt);
    if (f.recovery === 0) { f.state = 'idle'; f.animationAction = null; f.animationActionTimer = 0; }
    return;
  }
  if (f.hitstun > 0) {
    f.hitstun = Math.max(0, f.hitstun - dt); f.state = f.hitstun ? 'hit' : 'idle';
    if (!f.hitstun) { f.animationAction = null; f.animationActionTimer = 0; }
    f.x += f.vx * dt; f.vx *= .82;
  }
}

function settleTournament(t, won) {
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

class SpriteRenderer {
  constructor(manifest, base = 'game/assets/fighters/') {
    this.manifest = manifest;
    this.base = base;
    this.frames = new Map();
    this.failed = new Set();
  }

  stateFor(f) {
    if (f.state === 'attack' && f.move) {
      if (f.move.id === 'special') return 'special';
      if (f.move.id === 'punch') return 'jab';
      return f.move.id;
    }
    // Explicit animation actions are visual-only overlays on engine states.
    // Physics, hurtboxes and hit timing remain owned by the combat engine.
    if (f.animationAction) return f.animationAction;
    if (f.state === 'knockdown') return 'knockdown';
    if (f.state === 'recovery') return 'recovery';
    if (f.state === 'landing') return 'landing';
    if (f.state === 'victory') return 'victory';
    if (f.state === 'defeat') return 'defeat';
    if (f.state === 'hit') return 'hit_reaction';
    if (f.state === 'block') return 'block';
    if (f.state === 'crouch') return 'crouch_idle';
    if (f.state === 'jump') return f.vy < -30 ? 'jump_rise' : f.vy > 30 ? 'jump_fall' : 'jump_apex';
    if (Math.abs(f.vx) > 0.5) return Math.abs(f.vx) > f.def.move * 0.78 ? 'run' : 'walk';
    return 'idle';
  }

  resolve(fighter, requested) {
    if (!fighter?.spriteReady) return null;
    if (fighter.availableStates?.includes(requested) && this.manifest.states?.[requested]) {
      return { state: requested, spec: this.manifest.states[requested], playbackRate: 1 };
    }
    const candidates = (fighter.extensions || []).filter(v => v.from === requested && this.manifest.extensionStates?.[v.manifestKey || `${fighter.id}:${v.state}`]);
    let extension = candidates.find(v => v.state.endsWith('_phase4d')) || candidates[0];
    if (extension) return { state: extension.state, spec: this.manifest.extensionStates[extension.manifestKey || `${fighter.id}:${extension.state}`], playbackRate: extension.playbackRate || 1 };

    // Fast locomotion remains animated when a dedicated run sequence is absent.
    if (requested === 'run') {
      if (fighter.availableStates?.includes('walk') && this.manifest.states?.walk) {
        return { state: 'walk', spec: this.manifest.states.walk, playbackRate: 1.5 };
      }
      extension = (fighter.extensions || []).find(v => v.from === 'walk' && this.manifest.extensionStates?.[v.manifestKey || `${fighter.id}:${v.state}`]);
      if (extension) return { state: extension.state, spec: this.manifest.extensionStates[extension.manifestKey || `${fighter.id}:${extension.state}`], playbackRate: (extension.playbackRate || 1) * 1.5 };
    }
    return null;
  }

  frameIndex(f, state, spec, length) {
    if (f.state === 'attack' && f.move) {
      const startup = Math.max(0, f.move.startup || 0);
      const active = Math.max(0, f.move.active || 0);
      const total = startup + active + Math.max(0, f.move.recover || 0);
      const progress = Math.max(0, Math.min(1, total ? f.elapsed / total : 1));
      const phaseFrames = spec.phaseFrames;
      if (phaseFrames) {
        let phase, p;
        if (f.elapsed < startup) { phase = 'startup'; p = startup ? f.elapsed / startup : 1; }
        else if (f.elapsed <= startup + active) { phase = 'active'; p = active ? (f.elapsed - startup) / active : 1; }
        else { phase = 'recovery'; p = Math.max(0, Math.min(1, (f.elapsed - startup - active) / Math.max(0.001, total - startup - active))); }
        const selection = phaseFrames[phase];
        if (selection === 'static') return -1;
        if (Array.isArray(selection) && selection.length) return selection[Math.min(selection.length - 1, Math.floor(p * selection.length))];
        if (Number.isInteger(selection)) return selection;
      }
      if (length === 1 && spec.contactOnly) return f.elapsed >= startup && f.elapsed <= startup + active ? 0 : -1;
      if (length >= 3) {
        if (f.elapsed < startup) return 0;
        if (f.elapsed < startup + active) return Math.floor(length / 2);
        return length - 1;
      }
      return Math.floor(progress * length) % length;
    }

    const now = Number.isFinite(f.anim) ? f.anim : 0;
    const elapsed = f.animState === state ? Math.max(0, now - (f.animStart || 0)) : (f.animState = state, f.animStart = now, 0);
    let index = Math.floor(elapsed * 1000 * (spec.playbackRate || 1) / Math.max(1, spec.durationMs || 100));
    if (spec.loop) index %= length;
    else index = Math.min(length - 1, index);
    return index;
  }

  draw(ctx, f, x, y) {
    const fighter = this.manifest.fighters.find(v => v.id === f.def.id);
    const requested = this.stateFor(f);
    const resolved = this.resolve(fighter, requested);
    if (!resolved) return false;
    const { state, spec, playbackRate } = resolved;
    const directory = spec.directory || state;
    const arr = this.load(f.def.id, directory, spec.frames);
    if (!arr || arr.length !== spec.frames) return false;
    const index = this.frameIndex(f, state, { ...spec, playbackRate }, arr.length);
    if (index < 0 || index >= arr.length) return false;
    const img = arr[index];
    if (!img?.complete || !img.naturalWidth) return false;
    const scale = fighter.body?.visualScale || 0.395;
    const pivot = spec.pivot || fighter.body?.anchor || { x: 256, y: 448 };
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0008';
    ctx.beginPath();
    ctx.ellipse(x, y + 3, fighter.body?.halfWidth + 5 || 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(x, y);
    ctx.scale((f.face || 1) * scale, scale);
    ctx.drawImage(img, -pivot.x, -pivot.y, 512, 512);
    ctx.restore();
    f.spriteState = state;
    f.spriteFrame = index;
    return true;
  }

  load(id, state, count) {
    const key = `${id}:${state}`;
    if (this.failed.has(key)) return null;
    if (this.frames.has(key)) return this.frames.get(key);
    const out = [];
    this.frames.set(key, out);
    for (let n = 1; n <= count; n++) {
      const img = new Image();
      img.onerror = () => { this.failed.add(key); this.frames.delete(key); };
      const path = `${this.base}${id}/${state}/frame_${String(n).padStart(3, '0')}.png`;
      img.src = (typeof window !== 'undefined' && window.GIGA_ASSETS?.[path]) || path;
      out.push(img);
    }
    return out;
  }

  async preload(ids = this.manifest.fighters.map(f => f.id), timeoutMs = 6000) {
    const selected = new Set(ids);
    const waits = [];
    for (const fighter of this.manifest.fighters) {
      if (!selected.has(fighter.id) || !fighter.spriteReady) continue;
      const states = new Set(fighter.availableStates || []);
      for (const extension of fighter.extensions || []) states.add(extension.state);
      for (const state of states) {
        const extension = (fighter.extensions || []).find(x => x.state === state);
        const spec = this.manifest.states?.[state] || this.manifest.extensionStates?.[extension?.manifestKey || `${fighter.id}:${state}`] || this.manifest.extensionStates?.[state];
        if (!spec) continue;
        const images = this.load(fighter.id, spec.directory || state, spec.frames);
        if (!images) continue;
        for (const img of images) {
          if (img.complete) continue;
          waits.push(new Promise(resolve => {
            let settled = false;
            const finish = ok => { if (settled) return; settled = true; clearTimeout(timer); img.removeEventListener?.('load', onload); img.removeEventListener?.('error', onerror); if (!ok) this.failed.add(`${fighter.id}:${spec.directory || state}`); resolve(ok); };
            const onload = () => finish(!!img.naturalWidth);
            const onerror = () => finish(false);
            const timer = setTimeout(() => finish(false), timeoutMs);
            img.addEventListener?.('load', onload, { once: true });
            img.addEventListener?.('error', onerror, { once: true });
            if (img.complete) finish(!!img.naturalWidth);
          }));
        }
      }
    }
    await Promise.all(waits);
    return { loaded: [...this.frames.values()].flat().filter(img => img.complete && img.naturalWidth).length, failed: [...this.failed] };
  }
}



'use strict';


(()=>{
const $=s=>document.querySelector(s),view=$('#view'),title=$('#screen-title');
const roster=[
{id:'giga_champion',name:'GIGA CHAMPION',style:'Balanced powerhouse',tone:'#d8a72f',trim:'#f4dc94',hair:'#181219',skin:'#e0b58b',gear:'crown',stats:{speed:7,strength:8,defense:7},move:245,life:110,damage:1,special:'ROYAL GIGA SLAM',desc:'A regal all-rounder. Leap into the air and crash down with a golden shockwave.',ai:'balanced',portrait:'giga-giga_champion_portrait.png'},
{id:'viper_dash',name:'VIPER DASH',style:'Fast striker',tone:'#d69f3f',trim:'#f3ce68',hair:'#19131b',skin:'#c98769',gear:'headband',stats:{speed:10,strength:6,defense:6},move:305,life:95,damage:1,special:'VIPER RUSH',desc:'A short forward dash followed by three independently validated strikes.',ai:'rush',portrait:'giga-viper_dash_portrait.png'},
{id:'volt_lucha',name:'VOLT LUCHA',style:'Aerial wrestler',tone:'#9c67dc',trim:'#efc957',hair:'#30213b',skin:'#bd886a',gear:'mask',stats:{speed:8,strength:7,defense:6},move:285,life:100,damage:1,special:'THUNDER TORNADO',desc:'Rise, corkscrew through violet lightning, then dive on the descent.',ai:'aerial',portrait:'giga-volt_lucha_portrait.png'},
{id:'titan_rex',name:'TITAN REX',style:'Heavy powerhouse grappler',tone:'#b94838',trim:'#e4bf68',hair:'#321a17',skin:'#bd8d70',gear:'cape',stats:{speed:5,strength:10,defense:9},move:190,life:130,damage:1.1,special:'TITAN QUAKE',desc:'Plant, wind up and slam a red-and-gold shockwave across the mat.',ai:'heavy',portrait:'giga-titan_rex_portrait.png'},
{id:'nova_blaze',name:'NOVA BLAZE',style:'Acrobatic kick specialist',tone:'#8152bc',trim:'#e9bf61',hair:'#7c438e',skin:'#e0b394',gear:'ponytail',stats:{speed:9,strength:6,defense:6},move:292,life:95,damage:1,special:'NOVA STAR BURST',desc:'An aerial multi-kick combination capped by a violet-and-gold starburst.',ai:'combo',portrait:'giga-nova_blaze_portrait.png'}];
// Visual presentation only; collision and damage remain in the original engine.
const combatArt=Object.fromEntries(roster.map(f=>{const im=new Image();im.src=f.id==='giga_champion'?'giga-giga_champion-idle-frame_001.png':`giga-${f.id}-combat.png`;return [f.id,im]}));
const championIdle=Array.from({length:4},(_,i)=>{const im=new Image();im.src=`giga-giga_champion-idle-frame_00${i+1}.png`;return im});
const arenaArt=new Image();arenaArt.src='giga-championship-arena.webp';
const loaded=im=>im&&im.complete&&im.naturalWidth>0;
function drawArenaLights(c){if(save.settings.reducedMotion)return;c.save();c.globalCompositeOperation='screen';const t=game?.elapsed||0;for(const [x,color,phase] of [[210,'rgba(154,103,255,','0'],[750,'rgba(255,204,104,','1.7']]){const pulse=.08+.035*(.5+.5*Math.sin(t*1.4+Number(phase))),g=c.createRadialGradient(x,105,8,x,105,230);g.addColorStop(0,color+pulse+')');g.addColorStop(1,color+'0)');c.fillStyle=g;c.fillRect(x-230,0,460,310)}c.restore();}
const impactArt=Object.fromEntries(['impact_star','slam_burst','guard_burst','speed_slash'].map(id=>{const im=new Image();im.src=window.GIGA_ASSETS?.['game/assets/effects/'+id+'.png']||'game/assets/effects/'+id+'.png';return [id,im]}));
const impactEvents=[];
function spawnImpact(id,x,y,size=108){if(save.settings.reducedMotion)return;impactEvents.push({id,x,y,size,at:game?.elapsed||0,duration:.24});}
function drawImpactEvents(c){if(!game)return;const now=game.elapsed;c.save();for(const e of impactEvents){const age=now-e.at;if(age<0||age>=e.duration)continue;const im=impactArt[e.id];if(!loaded(im))continue;const p=age/e.duration,scale=.72+.38*p;c.globalAlpha=1-p;c.drawImage(im,e.x-e.size*scale/2,e.y-e.size*scale/2,e.size*scale,e.size*scale)}c.restore();while(impactEvents.length&&now-impactEvents[0].at>=impactEvents[0].duration)impactEvents.shift();}
const moveDefs={punch:{label:'Basic punch',startup:.12,active:.09,recover:.18,range:62,damage:8,stamina:6,kind:'high',meter:9},heavy:{label:'Heavy punch',startup:.26,active:.1,recover:.36,range:73,damage:16,stamina:15,kind:'high',meter:13},kick1:{label:'Kick 1',startup:.18,active:.11,recover:.27,range:77,damage:12,stamina:12,kind:'mid',meter:11},kick2:{label:'Kick 2',startup:.24,active:.12,recover:.34,range:83,damage:15,stamina:16,kind:'low',meter:12},kick3:{label:'Kick 3',startup:.32,active:.13,recover:.42,range:91,damage:20,stamina:22,kind:'air',meter:13},special:{label:'Signature',startup:.45,active:.48,recover:.65,range:165,damage:32,stamina:0,kind:'special',meter:0}};
const fighterMoves={giga_champion:{kick1:'Crown sweep',kick2:'Royal side kick',kick3:'Regal spin kick'},viper_dash:{kick1:'Low sweep',kick2:'Side kick',kick3:'Spinning kick'},volt_lucha:{kick1:'Dropkick',kick2:'Spinning heel kick',kick3:'Knee strike'},titan_rex:{kick1:'Front kick',kick2:'Heavy stomp',kick3:'Spinning big boot'},nova_blaze:{kick1:'Crescent kick',kick2:'Flip kick',kick3:'Scissor kick'}};
const fighterMoveData={giga_champion:{kick1:{kind:'low',range:76,damage:12},kick2:{kind:'mid',range:84,damage:15},kick3:{kind:'high',range:92,damage:20}},viper_dash:{kick1:{kind:'low',range:80,damage:12},kick2:{kind:'mid',range:88,damage:15},kick3:{kind:'high',range:94,damage:20}},volt_lucha:{kick1:{kind:'air',range:93,damage:12},kick2:{kind:'mid',range:86,damage:15},kick3:{kind:'high',range:82,damage:20}},titan_rex:{kick1:{kind:'mid',range:78,damage:12},kick2:{kind:'low',range:80,damage:15},kick3:{kind:'high',range:93,damage:20}},nova_blaze:{kick1:{kind:'high',range:84,damage:12},kick2:{kind:'air',range:98,damage:15},kick3:{kind:'air',range:104,damage:20}}};
const equipment=[{id:'gloves_starter',name:'Starter Gloves',slot:'Gloves',color:'bronze',level:1},{id:'gloves_royal',name:'Royal Gloves',slot:'Gloves',color:'gold',level:3},{id:'gloves_neon',name:'Neon Gloves',slot:'Gloves',color:'purple',level:7},{id:'boots_starter',name:'Starter Boots',slot:'Boots',color:'bronze',level:1},{id:'boots_royal',name:'Royal Boots',slot:'Boots',color:'gold',level:3},{id:'boots_neon',name:'Neon Boots',slot:'Boots',color:'purple',level:7},{id:'belt_starter',name:'Starter Belt',slot:'Belts',color:'bronze',level:1},{id:'belt_royal',name:'Royal Belt',slot:'Belts',color:'gold',level:3},{id:'belt_neon',name:'Neon Belt',slot:'Belts',color:'purple',level:7},{id:'cape_starter',name:'Starter Cape',slot:'Capes',color:'bronze',level:1},{id:'cape_royal',name:'Royal Cape',slot:'Capes',color:'gold',level:3},{id:'cape_neon',name:'Neon Cape',slot:'Capes',color:'purple',level:7}];
const starterItems=equipment.filter(i=>i.level===1).map(i=>i.id),SAVE_KEY='gigacoin_arena_save_v1';
const defaults=()=>({version:1,selectedFighter:'giga_champion',credits:0,fighters:Object.fromEntries(roster.map(f=>[f.id,{xp:0,level:1,points:0,skills:{punch:0,heavy:0,kick1:0,kick2:0,kick3:0},owned:[...starterItems],equipment:{}}])),history:[],completedMatchIds:[],settings:{music:0,sound:45,shake:true,reducedMotion:false,difficulty:'normal',keys:{left:'a',right:'d',jump:'w',crouch:'s',block:'Shift',punch:'j',heavy:'k',kick1:'l',kick2:'u',kick3:'i',special:'o'}},tournament:{wins:0,active:false,serial:0,awarded:[]}});
function load(){try{let raw=localStorage.getItem(SAVE_KEY),legacy=false;if(!raw){raw=localStorage.getItem('gigaArenaSave');legacy=!!raw}if(!raw)return defaults();let x=JSON.parse(raw),d=defaults();if(!x||typeof x!=='object')return d;let ids={champion:'giga_champion',viper:'viper_dash',volt:'volt_lucha',titan:'titan_rex',nova:'nova_blaze'},fighters={...d.fighters};for(let [oldId,v] of Object.entries(x.fighters||{})){let id=ids[oldId]||oldId;if(!fighters[id]||!v||typeof v!=='object')continue;fighters[id]={...fighters[id],...v,level:Math.max(1,Math.min(20,Number(v.level)||1)),xp:Math.max(0,Math.min(1000000000,Number(v.xp)||0)),points:Math.max(0,Number(v.points)||0),skills:{...fighters[id].skills,...v.skills},owned:Array.isArray(v.owned)?v.owned.filter(id=>equipment.some(it=>it.id===id)):([...starterItems,...(x.owned||[])].filter(id=>equipment.some(it=>it.id===id))),equipment:{...(v.equipment||{})}}}let selected=ids[x.selectedFighter]||x.selectedFighter||ids[x.selected]||x.selected||d.selectedFighter;if(!fighters[selected])selected=d.selectedFighter;let out={...d,...x,version:1,selectedFighter:selected,fighters,credits:Math.max(0,Math.floor(Number(x.credits)||0)),history:Array.isArray(x.history)?x.history.slice(0,100).map(h=>({...h,fighter:ids[h.fighter]||h.fighter,opponent:ids[h.opponent]||h.opponent})):[],completedMatchIds:Array.isArray(x.completedMatchIds)?x.completedMatchIds.slice(-500):[],settings:{...d.settings,...x.settings,keys:{...d.settings.keys,...x.settings?.keys}},tournament:{...d.tournament,...x.tournament,awarded:Array.isArray(x.tournament?.awarded)?x.tournament.awarded.filter(v=>typeof v==="string").slice(-500):[]}};out.credits=Math.min(1000000000,out.credits);out.history=out.history.filter(h=>h&&typeof h==="object").slice(0,100);out.completedMatchIds=out.completedMatchIds.filter(v=>typeof v==="string").slice(-500);out.settings.sound=Math.max(0,Math.min(100,Number(out.settings.sound)||0));out.settings.music=Math.max(0,Math.min(100,Number(out.settings.music)||0));if(!["easy","normal","hard"].includes(out.settings.difficulty))out.settings.difficulty="normal";let safeKeys={...d.settings.keys};for(let [k,v] of Object.entries(out.settings.keys||{}))if(Object.hasOwn(safeKeys,k)&&typeof v==="string"&&v.length<=20)safeKeys[k]=v;out.settings.keys=safeKeys;out.tournament.wins=Math.max(0,Math.min(3,Number(out.tournament.wins)||0));out.tournament.serial=Math.max(0,Number(out.tournament.serial)||0);for(let f of roster){let p=out.fighters[f.id];p.skills=p.skills||{};for(let k of ["punch","heavy","kick1","kick2","kick3"])p.skills[k]=Math.max(0,Math.min(2,Math.floor(Number(p.skills[k])||0)));p.points=Math.max(0,Math.min(200,Math.floor(Number(p.points)||0)));p.owned=Array.isArray(p.owned)?[...new Set(p.owned.filter(id=>equipment.some(it=>it.id===id)))]:[...starterItems];p.equipment=p.equipment&&typeof p.equipment==="object"?p.equipment:{}}if(legacy)localStorage.setItem(SAVE_KEY,JSON.stringify(out));return out}catch{return defaults()}}
let save=load(),screen='fighters',selected=roster.find(f=>f.id===save.selectedFighter)||roster[0],paused=false,game=null,raf=0,keys=new Set(),pointer=new Set(),cpuElapsed=0,toastTimer=0,debugOverlay=new URLSearchParams(location.search).get('debug')==='1',animationManifest=null,spriteRenderer=null;
const animationAssetsReady=(window.GIGA_MANIFEST?Promise.resolve(window.GIGA_MANIFEST):fetch('game/assets/animation_manifest.json').then(r=>{if(!r.ok)throw new Error('Animation manifest unavailable');return r.json()})).then(m=>{animationManifest=m;spriteRenderer=new SpriteRenderer(m,'game/assets/fighters/');return spriteRenderer}).catch(()=>null);
function persist(){save.selectedFighter=selected.id;try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){console.warn("Save unavailable",e)};if($('#credits'))$('#credits').textContent=save.credits}
function say(s){let e=$('.toast');if(e){e.textContent=s;clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.textContent='',2600)}}
function setScreen(s){if(game&&s!=='match')stopGame();screen=s;document.querySelectorAll('[data-screen]').forEach(b=>b.classList.toggle('selected',b.dataset.screen===s));render()}
function render(){title.textContent={fighters:'CHOOSE YOUR FIGHTER',training:'TRAINING ROOM',tournament:'CPU TOURNAMENT',skills:'FIGHTER SKILLS',inventory:'THE LOCKER',progression:'FIGHTER PROGRESSION',history:'MATCH HISTORY',settings:'GAME OPTIONS',match:'CHAMPIONSHIP BOUT'}[screen]||'GIGA ARENA';if(screen==='fighters')renderSelect();if(screen==='training')renderTraining();if(screen==='tournament')renderTournament();if(screen==='skills')renderSkills();if(screen==='inventory')renderInventory();if(screen==='progression')renderProgression();if(screen==='history')renderHistory();if(screen==='settings')renderSettings()}
function bars(f){return Object.entries(f.stats).map(([n,v])=>`<div class="stat"><span>${n.toUpperCase()}</span><div class="track"><i style="width:${v*10}%"></i></div><b>${v}</b></div>`).join('')}
function renderSelect(){view.innerHTML=`<div class="view-grid"><div><div class="fighters">${roster.map(f=>`<button class="fighter-card ${selected.id===f.id?'active':''}" data-fighter="${f.id}"><div class="fighter-art"><img src="${f.portrait}" alt="${f.name} portrait" onerror="this.hidden=true;this.nextElementSibling.hidden=false;window.drawPortraitFallback(this.nextElementSibling,this.nextElementSibling.dataset.portrait)"><canvas width="180" height="160" data-portrait="${f.id}" hidden></canvas><span class="level-badge">LV ${save.fighters[f.id].level}</span></div><span class="fighter-meta"><b>${f.name}</b><small>${f.style}</small></span></button>`).join('')}</div><div class="selected-fighter"><img src="${selected.portrait}" alt="${selected.name} portrait" onerror="this.src='gigacoin-coin.webp'"><div><p class="section-label">${selected.style.toUpperCase()} · LEVEL ${save.fighters[selected.id].level}</p><h3>${selected.name}</h3><p>${selected.desc}</p><a href="#" data-screen="progression">VIEW PROGRESSION →</a></div></div><div class="arena" id="matchmount"></div></div><aside class="side-panel"><h3>FIGHTER PROFILE</h3><div><p class="section-label">${selected.style.toUpperCase()}</p><h2 style="font-size:22px;margin:0">${selected.name}</h2><p class="muted">${selected.desc}</p><p class="section-label">ATTRIBUTES</p>${bars(selected)}</div><div><label class="section-label" for="opponent">CPU FIGHTER</label><select id="opponent">${roster.map(f=>`<option value="${f.id}">${f.name}${f.id===selected.id?' · MIRROR MATCH':''}</option>`).join('')}</select><label class="section-label" for="difficulty">CPU DIFFICULTY</label><select id="difficulty"><option value="easy" ${save.settings.difficulty==='easy'?'selected':''}>Easy</option><option value="normal" ${save.settings.difficulty==='normal'?'selected':''}>Normal</option><option value="hard" ${save.settings.difficulty==='hard'?'selected':''}>Hard</option></select><label class="section-label" for="mode">MATCH TYPE</label><select id="mode"><option value="exhibition">Quick Match · First to 2 rounds</option><option value="training">Training · No rewards</option><option value="tournament">CPU Tournament · Best of 3 bouts</option></select><button id="playnow" class="gold-button">START MATCH <span>↗</span></button><p class="muted">Local browser game. Credits are fictional game points with no cash or token value.</p></div></aside></div>`;
view.querySelectorAll('[data-fighter]').forEach(b=>b.onclick=()=>{selected=roster.find(f=>f.id===b.dataset.fighter);save.selectedFighter=selected.id;persist();renderSelect()});view.querySelectorAll('[data-portrait]').forEach(c=>drawFighter(c.getContext('2d'),c.width,c.height,roster.find(f=>f.id===c.dataset.portrait),.72,0,false));$('#difficulty').onchange=e=>{save.settings.difficulty=e.target.value;persist()};$('#playnow').onclick=()=>startGame($('#mode').value,$('#opponent').value)}
function renderSkills(){let p=save.fighters[selected.id],names={punch:'Basic punch',heavy:'Heavy punch',kick1:fighterMoves[selected.id].kick1,kick2:fighterMoves[selected.id].kick2,kick3:fighterMoves[selected.id].kick3};view.innerHTML=`<div class="view-grid"><div><div class="profile-strip"><img src="${selected.portrait}" alt="${selected.name}" onerror="this.src='gigacoin-coin.webp'"><div><p class="section-label">${selected.style.toUpperCase()}</p><h3>${selected.name}</h3><p>${selected.special}</p></div></div><p class="section-label">LEVEL ${p.level} · ${p.xp} XP · ${p.points} SKILL POINTS</p><p class="muted">Rank 2 costs 1 SP; rank 3 costs 2 SP. Each rank adds at most 5% move damage. Base moves always remain available.</p>${Object.entries(names).map(([id,name])=>{let rank=p.skills[id],base=moveDefs[id],cost=rank+1;return `<div class="skill-row"><div><b>${name}</b><small class="muted" style="display:block">Rank ${rank+1} / 3 · ${base.damage} base damage · ${base.stamina} stamina · ${(base.startup*1000)|0} ms startup · ${((rank<2)?'+5% next rank':'MAX')}</small></div><span class="section-label">${rank>=2?'MAX':`COST ${cost} SP`}</span><button data-skill="${id}" ${rank>=2||p.points<cost?'disabled':''}>${rank>=2?'MAX':'UPGRADE'}</button></div>`}).join('')}<p class="toast"></p></div><aside class="side-panel"><h3>FIGHTER RECORD</h3><img class="side-portrait" src="${selected.portrait}" alt="${selected.name}" onerror="this.src='gigacoin-coin.webp'"><p>${save.history.length} matches logged</p><p>${save.history.filter(h=>h.won).length} wins</p><p>${p.points} unspent skill points</p><button id="resetSkills" class="subtle-button">RESET SKILLS · REFUND POINTS</button></aside></div>`;view.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{let id=b.dataset.skill,rank=p.skills[id],cost=rank+1;if(rank<2&&p.points>=cost){p.points-=cost;p.skills[id]++;persist();renderSkills();say('Upgrade applied to '+selected.name+'.')}});$('#resetSkills').onclick=()=>{if(!confirm(`Refund all skill points spent on ${selected.name}?`))return;let refund=Object.values(p.skills).reduce((a,n)=>a+n*(n+1)/2,0);p.points+=refund;for(let k in p.skills)p.skills[k]=0;persist();renderSkills();say(`${refund} points refunded.`)}}
function renderInventory(){let p=save.fighters[selected.id];view.innerHTML=`<div class="view-grid"><div><div class="profile-strip"><img src="${selected.portrait}" alt="${selected.name}" onerror="this.src='gigacoin-coin.webp'"><div><p class="section-label">COSMETIC GEAR · ${selected.name}</p><h3>FIGHTER LOCKER</h3><p>Equipment is menu-only until matching animated overlays are available.</p></div></div><p class="muted">Starter cosmetics are unlocked. Royal items unlock at level 3; neon items unlock at level 7 for each fighter. No stat bonuses.</p>${equipment.map(it=>{let owned=p.owned.includes(it.id)||p.level>=it.level,eq=p.equipment[it.slot]===it.id;if(owned&&!p.owned.includes(it.id)){p.owned.push(it.id)}return `<div class="item-row"><div><b>${it.name}</b><small>${it.slot} · ${it.color} · ${it.level===1?'Starter item':`Unlock at fighter level ${it.level}`}</small></div><span class="section-label">${owned?(eq?'EQUIPPED':'OWNED'):'LOCKED'}</span><button data-item="${it.id}" ${!owned?'disabled':''}>${owned?(eq?'UNEQUIP':'EQUIP'):'LOCKED'}</button></div>`}).join('')}<p class="toast"></p></div><aside class="side-panel"><h3>LOADOUT PREVIEW</h3><img class="side-portrait tall" src="${selected.portrait}" alt="${selected.name}" onerror="this.src='gigacoin-coin.webp'"><p>${selected.name}</p><p>Owned by this fighter: ${p.owned.length}</p><p class="muted">Combat appearance remains the canonical artwork. Menu-only equipment is not faked on the arena fighter.</p></aside></div>`;persist();view.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{let it=equipment.find(x=>x.id===b.dataset.item),p=save.fighters[selected.id];if(p.level<it.level&&!p.owned.includes(it.id))return;if(p.equipment[it.slot]===it.id){if(!confirm(`Unequip ${it.name} from ${selected.name}?`))return;delete p.equipment[it.slot]}else{if(!confirm(`Equip ${it.name} on ${selected.name}? This cosmetic is shown in menus only.`))return;p.equipment[it.slot]=it.id}persist();renderInventory()})}
function renderProgression(){let p=save.fighters[selected.id],floor=p.level<=1?0:100*(p.level-1)*p.level/2,next=p.level>=20?floor:100*p.level*(p.level+1)/2,percent=p.level>=20?100:Math.max(0,Math.min(100,(p.xp-floor)/(next-floor)*100)),won=save.history.filter(h=>h.won).length;view.innerHTML=`<div class="progression-layout"><section class="side-panel"><div class="profile-strip"><img src="${selected.portrait}" alt="${selected.name}" onerror="this.src='gigacoin-coin.webp'"><div><p class="section-label">PER-FIGHTER PROGRESSION</p><h3>${selected.name}</h3><p>${selected.style}</p></div></div><h2>LEVEL ${p.level} <small>/ 20</small></h2><div class="progress-track"><i style="width:${percent}%"></i></div><p>${p.level>=20?'MAX LEVEL':`${Math.max(0,p.xp-floor)} / ${next-floor} XP to level ${p.level+1}`} · ${p.points} skill points</p><div class="stat-grid"><div><b>${p.xp}</b><small>TOTAL XP</small></div><div><b>${save.credits}</b><small>ARENA CREDITS</small></div><div><b>${save.history.length}</b><small>MATCHES</small></div><div><b>${won}</b><small>WINS</small></div></div><p class="muted">Cosmetic unlocks: Royal set at level 3; Neon set at level 7. Unlocks are per fighter.</p><button class="gold-button" data-screen="skills">UPGRADE SKILLS</button></section><section class="side-panel"><h3>FIGHTER ROSTER</h3><div class="progress-roster">${roster.map(f=>{let r=save.fighters[f.id],th=r.level>=20?0:100*r.level*(r.level+1)/2,base=r.level<=1?0:100*(r.level-1)*r.level/2,pr=r.level>=20?100:Math.max(0,Math.min(100,(r.xp-base)/(th-base)*100));return `<button class="progress-fighter ${f.id===selected.id?'active':''}" data-pick="${f.id}"><img src="${f.portrait}" alt=""><span><b>${f.name}</b><small>LV ${r.level} · ${r.xp} XP</small><i><em style="width:${pr}%"></em></i></span></button>`}).join('')}</div><button class="subtle-button" data-screen="history">VIEW MATCH HISTORY</button></section></div>`;view.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{selected=roster.find(f=>f.id===b.dataset.pick);save.selectedFighter=selected.id;persist();renderProgression()})}
function renderHistory(){let rows=save.history.map(h=>{let f=roster.find(x=>x.id===h.fighter),e=roster.find(x=>x.id===h.opponent),label=f?.name||h.fighter||'Fighter';return `<div class="history-row"><img src="${f?.portrait||'giga-giga_champion_portrait.png'}" alt=""><div><b>${label} vs ${e?.name||h.opponent||'CPU'}</b><small>${h.date?new Date(h.date).toLocaleDateString():'Previous match'} · ${String(h.mode||'match').toUpperCase()} · ${h.duration||0}s · ${h.damage||0} damage</small></div><strong class="${h.won?'win-text':'loss-text'}">${h.won?'WIN':'LOSS'}</strong><span>+${h.xp||0} XP<br>+${h.credits||0} AC</span></div>`}).join('');view.innerHTML=`<div class="view-grid"><section><p class="section-label">RECENT LOCAL RESULTS</p><p class="muted">Rewards are credited only once after a completed match. Training and abandoned bouts do not settle rewards.</p>${rows||'<div class="side-panel">No completed matches yet. Start a Quick Match to build your record.</div>'}</section><aside class="side-panel"><h3>CAREER TOTALS</h3><p>${save.history.length} completed matches</p><p>${save.history.filter(h=>h.won).length} wins · ${save.history.filter(h=>!h.won).length} losses</p><p>${save.credits} Arena Credits</p><button class="gold-button" data-screen="fighters">PLAY A MATCH</button></aside></div>`}
function renderTraining(){view.innerHTML=`<div class="training-board"><div class="profile-strip"><img src="${selected.portrait}" alt="${selected.name}" onerror="this.src='gigacoin-coin.webp'"><div><p class="section-label">MOVE PRACTICE · ${selected.name}</p><h3>TRAINING ROOM</h3><p>Reset your gauges at any time. The passive dummy will not attack or move.</p></div></div><div class="training-actions"><label>OPPONENT <select id="trainingOpponent"><option value="passive">Stationary dummy</option><option value="cpu">Practice CPU</option></select></label><button class="gold-button" id="beginTraining">START TRAINING</button></div><p class="muted">Damage, combo count and startup / active / recovery timing appear in the match HUD. No XP, credits, unlocks, progression or match history are awarded.</p></div>`;$('#beginTraining').onclick=()=>startGame('training',$('#trainingOpponent').value==='passive'?'passive':undefined)}function renderTournament(){let t=save.tournament,opponents=roster.filter(f=>f.id!==selected.id),idx=t.wins>=3?0:t.wins%opponents.length,opp=opponents[idx],labels=['Quarter-final','Semi-final','Final'];view.innerHTML=`<div class="view-grid"><section class="side-panel"><p class="section-label">OFFLINE CPU BRACKET</p><h3>THREE BOUTS · ONE CHAMPION</h3>${labels.map((n,i)=>`<div class="item-row"><div><b>${n}</b><small>${i===t.wins?opp.name:`Bout ${i+1}`}</small></div><span class="section-label">${i<t.wins?'CLEARED':i===t.wins?'NEXT':'LOCKED'}</span></div>`).join('')}<p>Record: ${t.wins}/3 bouts won</p><button id="enterTournament" class="gold-button">${t.active?'CONTINUE TO BOUT':'ENTER TOURNAMENT'}</button><p class="muted">Earn the normal match reward for each completed bout and a one-time 300 Arena Credit completion bonus. No credits are awarded for an abandoned bout.</p></section><aside class="side-panel"><h3>YOUR CHALLENGER</h3><div class="profile-strip"><img src="${opp.portrait}" alt="${opp.name}" onerror="this.src='gigacoin-coin.webp'"><div><p class="section-label">${opp.style.toUpperCase()}</p><h3>${opp.name}</h3><p>${opp.desc}</p></div></div><label class="section-label">CPU DIFFICULTY</label><select id="tourDifficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option></select></aside></div>`;$('#enterTournament').onclick=()=>{if(!t.active){t.active=true;t.serial=(t.serial||0)+1;t.wins=0;persist()}save.settings.difficulty=$('#tourDifficulty').value;persist();startGame('tournament',opp.id)}}
function renderSettings(){let k=save.settings.keys;view.innerHTML=`<div class="view-grid"><div class="side-panel"><h3>GAMEPLAY & ACCESSIBILITY</h3>${[['sound','Sound volume',0,100],['music','Music volume',0,100]].map(([id,n,min,max])=>`<label class="form-row">${n}<input data-setting="${id}" type="range" min="${min}" max="${max}" value="${save.settings[id]}"></label>`).join('')}<label class="form-row">Screen shake<input data-setting="shake" type="checkbox" ${save.settings.shake?'checked':''}></label><label class="form-row">Reduced motion<input data-setting="reducedMotion" type="checkbox" ${save.settings.reducedMotion?'checked':''}></label><label class="form-row">CPU difficulty<select data-setting="difficulty"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select></label></div><aside class="side-panel"><h3>DESKTOP CONTROLS</h3><p class="muted">Click a key field and press a key to remap.</p>${Object.entries(k).map(([id,key])=>`<label class="form-row">${id.toUpperCase()}<input class="keybind" data-key="${id}" value="${key}" readonly size="5"></label>`).join('')}<button id="resetSave" class="subtle-button">RESET ALL PROGRESS</button><p class="muted">Reset requires confirmation. Saves are local to this browser.</p><p class="toast"></p></aside></div>`;view.querySelector('[data-setting="difficulty"]').value=save.settings.difficulty;view.querySelectorAll('[data-setting]').forEach(el=>el.onchange=()=>{let v=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;save.settings[el.dataset.setting]=v;persist()});view.querySelectorAll('[data-key]').forEach(el=>el.onkeydown=e=>{e.preventDefault();k[el.dataset.key]=e.key===' '?'Space':e.key;el.value=k[el.dataset.key];persist()});$('#resetSave').onclick=()=>{if(confirm('Reset all GigaCoin Arena progress, credits, skills, gear, settings and match history?')){save=defaults();selected=roster[0];persist();renderSettings();say('Progress reset.')}}}
function createFighter(def,x,isPlayer){return {def,x,y:0,vx:0,vy:0,face:isPlayer?1:-1,hp:def.life,maxHp:def.life,stamina:100,meter:0,state:'idle',move:null,elapsed:0,hitstun:0,knockdown:0,recovery:0,buffered:null,block:false,air:false,used:new Set(),combo:0,comboTime:0,isPlayer,roundWins:0,landed:0,damageDealt:0,anim:0}}
function startGame(mode,opponentId){if(raf)cancelAnimationFrame(raf);frame.last=0;accumulator=0;selected=roster.find(f=>f.id===selected.id)||roster[0];if(mode==="tournament"&&!save.tournament.active){save.tournament.active=true;save.tournament.serial=(save.tournament.serial||0)+1;save.tournament.wins=0;persist()}let passive=mode==='training'&&opponentId==='passive',opponent=roster.find(f=>f.id===opponentId)||roster[(roster.indexOf(selected)+1)%roster.length];game={mode,passive,player:createFighter(selected,330,true),cpu:createFighter(opponent,630,false),round:1,time:90,elapsed:0,roundOver:0,finished:false,started:performance.now(),roundResults:[],rewarded:false,trainingDamage:0,trainingTiming:'READY',trainingCombo:0};if(passive)game.cpu.state='idle';const match=game;paused=false;cpuElapsed=0;impactEvents.length=0;keys.clear();pointer.clear();screen='match';title.textContent='CHAMPIONSHIP BOUT';view.innerHTML=`<div class="arena"><div class="hud"><div class="hudfighter"><div class="hud-name"><img src="${selected.portrait}" alt=""><b>${selected.name}</b></div><div class="meter"><i id="php"></i></div><div class="meter stamina"><i id="pst"></i></div><div class="meter special"><i id="pm"></i></div><small id="prounds">○ ○</small></div><div class="clock"><span id="roundNo">R1</span><br><span id="timer">90</span></div><div class="hudfighter"><div class="hud-name"><img src="${opponent.portrait}" alt=""><b>${passive?'TRAINING DUMMY':opponent.name}</b></div><div class="meter"><i id="ehp"></i></div><div class="meter stamina"><i id="est"></i></div><div class="meter special"><i id="em"></i></div><small id="erounds">○ ○</small></div></div><canvas id="fight" width="960" height="500" tabindex="0" aria-label="GigaCoin wrestling match"></canvas><div class="game-msg" id="msg">Preparing fighter animations…</div><div id="trainingReadout" class="game-msg" ${mode==='training'?'':'hidden'}>DAMAGE 0 · COMBO 0 · READY</div><button id="resetTrainingMatch" class="subtle-button" ${mode==='training'?'':'hidden'}>RESET TRAINING</button><div class="controls"><div class="move-control"><button data-action="left">◀</button><button data-action="right">▶</button></div><button data-action="jump">JUMP</button><button data-action="crouch">CROUCH</button><button data-action="block">BLOCK</button><button data-action="punch">PUNCH J</button><button data-action="heavy">HEAVY K</button><button data-action="kick1">KICK L</button><button data-action="kick2">SWEEP U</button><button data-action="kick3">AIR KICK I</button><button data-action="special">SPECIAL O</button><button id="pause">PAUSE</button></div><p class="game-note">A/D move · W jump · S crouch · Shift block · J/K/L/U/I attacks · O special · Esc pause. Touch and hold directional/block controls. Move + attack works together.</p><div id="result"></div></div>`;
$('#resetTrainingMatch')?.addEventListener('click',()=>{for(const f of [game.player,game.cpu]){f.hp=f.maxHp;f.stamina=100;f.meter=100;resetTransient(f,f===game.player?330:630)}game.trainingDamage=0;game.trainingCombo=0;game.trainingTiming='READY';updateHUD();$('#msg').textContent='TRAINING RESET';});
 const c=$('#fight');wireInputs(c);$('#pause').onclick=togglePause;$('#fight').focus();void (async()=>{void animationAssetsReady.then(r=>r?.preload([match.player.def.id,match.cpu.def.id])).catch(()=>{});if(game!==match||screen!=='match')return;$('#msg').textContent='Fight!';drawArena();raf=requestAnimationFrame(frame)})()}
function stopGame(){cancelAnimationFrame(raf);frame.last=0;accumulator=0;window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',offKey);window.removeEventListener('blur',clearInputs);game=null;keys.clear();pointer.clear()}
const actionKeys=['left','right','jump','crouch','block'];function wireInputs(c){window.addEventListener('keydown',onKey);window.addEventListener('keyup',offKey);window.addEventListener('blur',clearInputs);c.addEventListener('pointerdown',()=>c.focus());document.querySelectorAll('[data-action]').forEach(b=>{let a=b.dataset.action;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(actionKeys.includes(a))pointer.add(a);else fire(game?.player,a)};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>pointer.delete(a)));b.oncontextmenu=e=>e.preventDefault()})}
function onKey(e){if(screen!=='match'||!game)return;if(e.key==='Escape'){e.preventDefault();togglePause();return}if(e.key==='F3'){e.preventDefault();debugOverlay=!debugOverlay;return}let binds=save.settings.keys,aliases={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',ArrowDown:'crouch'},act=Object.entries(binds).find(([,v])=>v.toLowerCase()===e.key.toLowerCase())?.[0]||aliases[e.key];if(!act)return;e.preventDefault();if(actionKeys.includes(act)){keys.add(act);return}if(!e.repeat)fire(game.player,act)}function offKey(e){if(!game)return;let aliases={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',ArrowDown:'crouch'},act=Object.entries(save.settings.keys).find(([,v])=>v.toLowerCase()===e.key.toLowerCase())?.[0]||aliases[e.key];if(act)keys.delete(act)}function clearInputs(){keys.clear();pointer.clear()}
function togglePause(){if(!game||game.finished)return;paused=!paused;keys.clear();pointer.clear();$('#msg').textContent=paused?'PAUSED':'Fight!';let b=$('#pause');if(b)b.textContent=paused?'RESUME':'PAUSE';if(paused){$('#result').innerHTML=`<div class="results pause-screen"><p class="section-label">MATCH PAUSED</p><h2>PAUSED</h2><div class="play-row"><button class="gold-button" id="resume">RESUME</button><button class="subtle-button" id="restart">RESTART</button><button class="subtle-button" id="quit">QUIT MATCH</button></div></div>`;$('#resume').onclick=()=>togglePause();$('#restart').onclick=()=>startGame(game.mode,game.cpu.def.id);$('#quit').onclick=()=>{if(confirm('Quit this match? No rewards will be settled.'))setScreen('fighters')}}else $('#result').innerHTML=''}
function fire(f,id){if(!game||paused||game.finished||game.roundOver>0||f.hitstun>0||f.knockdown>0||f.recovery>0)return;if(f.state==='attack'){let total=f.move.startup+f.move.active+f.move.recover;if(total-f.elapsed<=.1&&['punch','heavy','kick1','kick2','kick3','special','jump'].includes(id))f.buffered={id,expires:game.elapsed+.1};return}if(id==='jump'){if(!f.air&&f.state!=='attack'){f.vy=-430;f.air=true;f.state='jump';f.animationAction='jump_takeoff';f.animationActionTimer=.16;f._crouchVisual=false;f.y=-1}return}if(id==='crouch'||id==='block')return;let data={...moveDefs[id]};if(!data)return;data.id=id;data.label=fighterMoves[f.def.id]?.[id]||data.label;Object.assign(data,fighterMoveData[f.def.id]?.[id]||{});let prog=save.fighters[f.def.id]?.skills?.[id]||0;data.damage*=1+prog*.05;if(id==='special'){data.damage=32;data.stamina=0;if(f.def.id==='giga_champion'){data.startup=.82;data.active=.2;data.recover=.72;data.range=150}else if(f.def.id==='viper_dash'){data.startup=.35;data.active=.48;data.recover=.65;data.range=86}else if(f.def.id==='volt_lucha'){data.startup=.42;data.active=.28;data.recover=.72;data.range=118}else if(f.def.id==='titan_rex'){data.startup=.45;data.active=.42;data.recover=.82;data.range=190}else if(f.def.id==='nova_blaze'){data.startup=.45;data.active=.48;data.recover=.7;data.range=120}}if(f.stamina<data.stamina){if(f.isPlayer)$('#msg').textContent='LOW STAMINA';return}if(id==='special'&&f.meter<100){if(f.isPlayer)$('#msg').textContent='SIGNATURE METER NOT READY';return}f.stamina-=data.stamina;if(id==='special')f.meter=0;f.move=data;f.elapsed=0;f.used=new Set();f.state='attack';f.block=false;f.anim=0;f.launched=false;f.specialHitCount=0;f.buffered=null}
function cpuBrain(dt){
 let a=game.cpu,b=game.player;
 if(a.hitstun>0||a.knockdown>0||a.recovery>0||(a.state==='attack'&&a.elapsed<a.move.startup+a.move.active+a.move.recover*.55))return;
 cpuElapsed-=dt;const difficulty=save.settings.difficulty,wait=difficulty==='easy'?.85:difficulty==='hard'?.32:.55;
 if(cpuElapsed>0)return;cpuElapsed=wait+Math.random()*(difficulty==='easy'?.6:.38);
 const dist=Math.abs(b.x-a.x),toward=Math.sign(b.x-a.x)||1;
 if(b.state==='attack'&&dist<108&&Math.random()<(difficulty==='hard'?.62:difficulty==='normal'?.35:.18)){a.block=true;a.vx=0;a.state='block';return;}
 a.block=false;
 if(dist>74){a.vx=toward*a.def.move*(a.def.ai==='rush'?1.12:1);if(a.def.ai==='aerial'&&Math.random()<.12&&!a.air)fire(a,'jump');return;}
 a.vx=0;const power=difficulty==='hard'?.48:.26;if(a.stamina<20)return;
 if(a.meter>=100&&dist<=150&&Math.random()<power){fire(a,'special');return;}
 let choices=['punch','heavy','kick1','kick2','kick3'];
 choices=choices.filter(id=>{const range=(fighterMoveData[a.def.id]?.[id]?.range)||moveDefs[id].range;return range>=dist;});
 if(!choices.length){a.vx=toward*a.def.move*.55;return;}
 let preferred;
 if(a.def.ai==='heavy')preferred=dist<=73?'heavy':'kick2';
 else if(a.def.ai==='aerial')preferred=dist<=62?'punch':dist<=98?'kick3':'kick1';
 else if(a.def.ai==='rush')preferred=dist<=62?'punch':'kick1';
 else if(a.def.ai==='combo')preferred=dist<=62?'punch':dist<=104?'kick3':'kick1';
 else preferred=dist<=62?(Math.random()<.45?'punch':'heavy'):'kick1';
 if(!choices.includes(preferred))preferred=choices.reduce((best,id)=>((fighterMoveData[a.def.id]?.[id]?.range)||moveDefs[id].range)<((fighterMoveData[a.def.id]?.[best]?.range)||moveDefs[best].range)?id:best,choices[0]);
 if(difficulty==='easy'&&Math.random()<.38)return;fire(a,preferred);
}
function frame(t){if(screen!=='match'||!game)return;if(!frame.last)frame.last=t;let dt=Math.min(.033,(t-frame.last)/1000);frame.last=t;if(!paused)accumulate(dt);drawArena();if(game){raf=requestAnimationFrame(frame)}else frame.last=0}
let accumulator=0;function accumulate(dt){accumulator+=dt;while(accumulator>=1/60){tick(1/60);accumulator-=1/60}}
function tick(dt){if(!game||game.finished)return;let g=game,p=g.player,e=g.cpu;g.elapsed+=dt;if(g.roundOver>0){g.roundOver-=dt;if(g.roundOver<=0)nextRound();return}g.time-=dt;if(g.mode!=='training'&&g.time<=0){endRound(Math.abs(p.hp/p.maxHp-e.hp/e.maxHp)<.001?'draw':p.hp/p.maxHp>e.hp/e.maxHp?'player':'cpu','TIME');return}for(let f of [p,e]){f.comboTime-=dt;if(f.comboTime<=0)f.combo=0;if(f.animationActionTimer>0){f.animationActionTimer=Math.max(0,f.animationActionTimer-dt);if(f.animationActionTimer===0)f.animationAction=null}const crouching=f.state==='crouch';if(crouching&&!f._crouchVisual){f.animationAction='crouch_entry';f.animationActionTimer=.16}else if(crouching&&f.animationActionTimer===0)f.animationAction='crouch_idle';else if(!crouching&&f._crouchVisual){f.animationAction='crouch_exit';f.animationActionTimer=.16}f._crouchVisual=crouching;if(f.state==='jump'&&f.air&&f.animationActionTimer===0)f.animationAction=f.vy < -45?'jump_rise':f.vy>45?'jump_fall':'jump_apex';f.stamina=Math.min(100,f.stamina+dt*(f.state==='attack'?4:f.block?4:15));f.meter=Math.min(100,f.meter);if(f.state==='knockdown'||f.state==='recovery'||f.state==='hit'||f.state==='landing'){advanceState(f,dt);continue}f.anim+=dt;f.vy+=1000*dt;f.y+=f.vy*dt;if(f.y>=0){if(f.air&&f.y>0&&f.state!=='attack'){f.state='landing';f.animationAction='landing';f.animationActionTimer=.16;f.landTimer=.16}f.y=0;f.vy=0;f.air=false}if(f.state==='attack'){f.elapsed+=dt;let m=f.move,target=f===p?e:p;if(g.mode==='training'&&f===p){let phase=f.elapsed<m.startup?'STARTUP':f.elapsed<m.startup+m.active?'ACTIVE':'RECOVERY',readout=$('#trainingReadout');if(readout)readout.textContent=`DAMAGE ${Math.round(g.trainingDamage)} · COMBO ${f.combo} · ${phase} ${Math.round(m.startup*1000)}/${Math.round(m.active*1000)}/${Math.round(m.recover*1000)} ms`;}if(m.kind==='special'&&!f.launched&&((f.def.id==='giga_champion'&&f.elapsed>=.08)||(f.def.id==='volt_lucha'&&f.elapsed>=.1)||(f.def.id==='nova_blaze'&&f.elapsed>=.08))){f.vy=f.def.id==='giga_champion'?-430:-350;f.air=true;f.launched=true}if(m.kind==='special'&&f.def.id==='viper_dash'&&f.elapsed>=m.startup*.35&&Math.abs(target.x-f.x)>58)f.x+=f.face*Math.min(650*dt,Math.max(0,Math.abs(target.x-f.x)-58));if(isAttackActive(m,f.elapsed))resolveHits(f,target);if(f.state==='attack'&&f.move===m&&f.elapsed>=m.startup+m.active+m.recover){f.state='idle';f.move=null;f.elapsed=0;f.animationAction=null;f.animationActionTimer=0;let buffered=f.buffered;f.buffered=null;if(buffered&&game.elapsed<=buffered.expires)fire(f,buffered.id)}}else if(f.state!=='block'&&f.state!=='landing')f.state=(keys.has('crouch')||pointer.has('crouch'))&&f.isPlayer?'crouch':f.air?'jump':'idle'}
let horizontal=(keys.has('right')||pointer.has('right')?1:0)-(keys.has('left')||pointer.has('left')?1:0);movementState(p,{blocking:keys.has('block')||pointer.has('block'),horizontal,crouching:keys.has('crouch')||pointer.has('crouch')});if(p.hitstun<=0&&p.knockdown<=0&&p.recovery<=0&&p.state!=='attack'){approachVelocity(p,horizontal,dt,p.def.move*(p.block?.38:1),p.def.id==='titan_rex'?900:1450);p.x+=p.vx*dt}if(!p.air&&(keys.has('jump')||pointer.has('jump'))&&p.state!=='attack')fire(p,'jump');if(!g.passive)cpuBrain(dt);else{e.vx=0;e.block=false;e.state='idle'}if(e.hitstun<=0&&e.knockdown<=0&&e.recovery<=0&&e.state!=='attack'&&!g.passive){let toward=p.x-e.x,step=e.vx*dt;if(step*toward>0)step=Math.sign(step)*Math.min(Math.abs(step),Math.max(0,Math.abs(toward)-74));e.x+=step}separateBodies(p,e,{passiveB:g.passive});clampFighterX(p);clampFighterX(e);updateFacing(p,e,6);updateFacing(e,p,6);$('#timer').textContent=Math.max(0,Math.ceil(g.time));updateHUD()}function resolveHits(a,b){let m=a.move,special=m.kind==='special',dist=Math.abs(a.x-b.x),forward=(b.x-a.x)*a.face>0;if(special&&a.def.id==='giga_champion'&&(a.air||a.y< -24||b.air||b.y< -24))return;if(special&&a.def.id==='volt_lucha'&&a.vy<0)return;if(special&&a.def.id==='titan_rex'&&(a.air||b.air||b.state==='jump'))return;if(special&&a.def.id==='nova_blaze'&&dist>120)return;if(special&&a.def.id==='viper_dash'&&dist>88)return;if(m.kind==='low'&&b.air)return;if(m.kind==='high'&&b.state==='crouch')return;if(m.kind==='air'&&b.state==='crouch')return;if(!forward||dist>m.range||Math.abs(a.y-b.y)>95)return;let events=special&&a.def.id==='viper_dash'?3:special&&a.def.id==='nova_blaze'?4:1,elapsed=a.elapsed-m.startup,index=special?Math.min(events-1,Math.floor(elapsed/(m.active/events))):0,key=special?`special-${index}`:'hit';if(a.used.has(key))return;a.used.add(key);let blocked=b.block&&b.state==='block'&&m.kind!=='low';const impactY=395+(b.x-480)*.025+(b.y||0)-(blocked?88:74),impactId=blocked?'guard_burst':special&&a.def.id==='viper_dash'?'speed_slash':special&&(a.def.id==='giga_champion'||a.def.id==='titan_rex')?'slam_burst':'impact_star';spawnImpact(impactId,b.x,impactY,special?160:blocked?118:94);let perHit=special&&events>1?m.damage/events:m.damage,scale=a.def.damage,dmg=perHit*scale*(blocked?.2:1);b.hp=Math.max(0,b.hp-dmg);let heavyHit=m.id==='heavy';if(blocked){interrupt(b,.12,0);b.vx=a.face*25}else if(causesKnockdown(m,dmg)){interrupt(b,.3,.72);b.vx=a.face*155}else{interrupt(b,special?.3:heavyHit?.31:.2,0);b.vx=a.face*(special?155:heavyHit?165:95)}a.meter=Math.min(100,a.meter+(blocked?Math.ceil(m.meter*.5):m.kind==='special'?0:m.meter));a.landed++;a.combo++;a.comboTime=1.2;a.damageDealt+=dmg;if(a.isPlayer)$('#msg').textContent=blocked?'GUARDED':a.combo>1?`${a.combo} HIT COMBO`:'CLEAN HIT';if(save.settings.shake&&!save.settings.reducedMotion)document.querySelector('#fight').classList.add('shake');setTimeout(()=>document.querySelector('#fight')?.classList.remove('shake'),100);if(game.mode==='training'&&a===game.player){game.trainingDamage+=dmg;game.trainingCombo=a.combo;game.trainingTiming=`${Math.round(m.startup*1000)}/${Math.round(m.active*1000)}/${Math.round(m.recover*1000)} ms`;let readout=$('#trainingReadout');if(readout)readout.textContent=`DAMAGE ${Math.round(game.trainingDamage)} · LAST HIT ${Math.round(dmg)} · COMBO ${a.combo} · START ${Math.round(m.startup*1000)} / ACTIVE ${Math.round(m.active*1000)} / RECOVERY ${Math.round(m.recover*1000)} ms`;}if(b.hp<=0&&game.mode!=='training')endRound(a===game.player?'player':'cpu','KNOCKOUT');if(game.mode==='training'&&b.hp<=0){b.hp=b.maxHp;b.stamina=100;b.meter=100;resetTransient(b,b===game.cpu?630:330)}}
function updateHUD(){if(!game)return;let g=game;$('#php').style.width=`${g.player.hp/g.player.maxHp*100}%`;$('#ehp').style.width=`${g.cpu.hp/g.cpu.maxHp*100}%`;$('#pst').style.width=`${g.player.stamina}%`;$('#est').style.width=`${g.cpu.stamina}%`;$('#pm').style.width=`${g.player.meter}%`;$('#em').style.width=`${g.cpu.meter}%`;$('#roundNo').textContent='R'+g.round;$('#prounds').textContent='● '.repeat(g.player.roundWins)+'○ '.repeat(2-g.player.roundWins);$('#erounds').textContent='● '.repeat(g.cpu.roundWins)+'○ '.repeat(2-g.cpu.roundWins)}
function endRound(winner,why){if(!game||game.roundOver>0)return;let g=game;g.roundResults.push(winner);if(winner==='player')g.player.roundWins++;if(winner==='cpu')g.cpu.roundWins++;$('#msg').textContent=winner==='draw'?`${why} · ROUND DRAW`:winner==='player'?`ROUND ${g.round} · ${why} · YOU WIN`:`ROUND ${g.round} · ${why} · RIVAL WINS`;g.roundOver=winner==='draw'?1.7:1.5;if(g.player.roundWins>=2||g.cpu.roundWins>=2)finishMatch(g.player.roundWins>g.cpu.roundWins)}
function nextRound(){if(game.finished)return;if(game.roundResults.at(-1)!=='draw')game.round++;game.time=90;game.player.hp=game.player.maxHp;game.cpu.hp=game.cpu.maxHp;resetTransient(game.player,330);resetTransient(game.cpu,630);game.player.meter=Math.max(30,game.player.meter);game.cpu.meter=Math.max(25,game.cpu.meter);$('#msg').textContent=game.roundResults.at(-1)==='draw'?'DRAW · REPLAY THE ROUND':'NEXT ROUND · FIGHT!';updateHUD()}function levelForXP(xp){let level=1;while(level<20&&xp>=100*level*(level+1)/2)level++;return level}
function finishMatch(won){let g=game;if(g.rewarded)return;g.finished=true;g.rewarded=true;g.player.state=won?'victory':'defeat';g.cpu.state=won?'defeat':'victory';if(g.mode==='training'){g.trainingDamage=Math.round(g.trainingDamage);$('#result').innerHTML=`<div class="results"><p class="section-label">TRAINING SESSION COMPLETE</p><h2>GOOD WORK</h2><p>${selected.name} · ${g.trainingDamage} damage · best combo ${g.player.combo}</p><p>No progression, rewards or match history were changed.</p><div class="play-row"><button class="gold-button" id="rematch">PRACTICE AGAIN</button><button class="subtle-button" id="mainmenu">MAIN MENU</button></div></div>`;$('#rematch').onclick=()=>startGame('training',g.passive?'passive':g.cpu.def.id);$('#mainmenu').onclick=()=>setScreen('fighters');return;}let id=(globalThis.crypto?.randomUUID?.()||`match-${Date.now()}-${Math.random().toString(16).slice(2)}`);if(save.completedMatchIds.includes(id))return;save.completedMatchIds.push(id);save.completedMatchIds=save.completedMatchIds.slice(-500);let training=g.mode==='training',xp=training?0:(won?100:40),credits=training?0:(won?40:10),tournamentBonus=0,p=save.fighters[selected.id],oldLevel=p.level;p.xp+=xp;let next=levelForXP(p.xp);if(next>p.level){p.points+=next-p.level;p.level=next}for(let item of equipment)if(item.level<=p.level&&!p.owned.includes(item.id))p.owned.push(item.id);if(g.mode==='tournament'){if(won){save.tournament.wins++;if(save.tournament.wins>=3){let tournamentId=`tournament-${save.tournament.serial}`;if(!save.tournament.awarded.includes(tournamentId)){save.tournament.awarded.push(tournamentId);tournamentBonus=300}save.tournament.active=false;save.tournament.wins=3}}else{save.tournament.active=false;save.tournament.wins=0}}credits+=tournamentBonus;save.credits+=credits;let entry={id,date:new Date().toISOString(),fighter:selected.id,opponent:g.cpu.def.id,won,xp,credits,tournamentBonus,mode:g.mode,duration:Math.round((performance.now()-g.started)/1000),damage:Math.round(g.player.damageDealt),rounds:[...g.roundResults]};save.history.unshift(entry);save.history=save.history.slice(0,100);persist();let rounds=entry.rounds.map((x,i)=>`<div class="result-round"><span>ROUND ${i+1}</span><b>${x==='player'?'WIN':x==='cpu'?'LOSS':'DRAW'}</b></div>`).join(''),body=`<div class="results"><div class="result-fighters"><img src="${selected.portrait}" alt="${selected.name}" onerror="this.src='gigacoin-coin.webp'"><span>VS</span><img src="${g.cpu.def.portrait}" alt="${g.cpu.def.name}" onerror="this.src='gigacoin-coin.webp'"></div><p class="section-label">${g.mode.toUpperCase()} COMPLETE</p><h2>${won?'VICTORY':'DEFEAT'}</h2><p>${selected.name} vs ${g.cpu.def.name} · ${entry.duration}s · ${Math.round(g.player.damageDealt)} damage dealt</p><div class="round-results">${rounds}</div><p>+${xp} XP · +${credits-tournamentBonus} Arena Credits${tournamentBonus?` · +${tournamentBonus} TOURNAMENT BONUS`:''} ${next>oldLevel?`· LEVEL ${next}!`:''}</p>${g.mode==='tournament'?`<p>Tournament record: ${save.tournament.wins}/3 bouts${tournamentBonus?' · COMPLETE':''}</p>`:''}<div class="play-row"><button class="gold-button" id="rematch">REMATCH</button><button class="subtle-button" id="mainmenu">MAIN MENU</button></div></div>`;$('#result').innerHTML=body;$('#rematch').onclick=()=>startGame(g.mode,g.mode==='tournament'?roster.filter(f=>f.id!==selected.id)[save.tournament.wins%4].id:g.cpu.def.id);$('#mainmenu').onclick=()=>setScreen('fighters');$('#msg').textContent='MATCH COMPLETE'}
function drawArena(){if(!game)return;let c=$('#fight')?.getContext('2d');if(!c)return;let W=960,H=500;c.clearRect(0,0,W,H);c.fillStyle='#0a0810';c.fillRect(0,0,W,H);if(loaded(arenaArt)){c.drawImage(arenaArt,0,0,W,H)}else{let bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#151026');bg.addColorStop(.72,'#281536');bg.addColorStop(1,'#684359');c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle='#b58e40';c.fillRect(0,410,W,6);c.strokeStyle='#d5ab55';c.lineWidth=3;[255,295,335].forEach(y=>{c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()})}drawArenaLights(c);let p=game.player,e=game.cpu;drawFighter(c,W,H,p.def,p.x,p.y,true,p),drawFighter(c,W,H,e.def,e.x,e.y,false,e);drawImpactEvents(c);if(game.player.move?.kind==='special')effect(c,p);if(game.cpu.move?.kind==='special')effect(c,e);if(debugOverlay){for(const f of [p,e]){const shape=bodyShape(f),gy=395+(f.x-480)*.025+(f.y||0),left=f.x-shape.halfWidth,top=gy-shape.height;c.strokeStyle=f===p?'#69efff':'#ff6d6d';c.lineWidth=2;c.strokeRect(left,top,shape.halfWidth*2,shape.height);c.strokeStyle='#ffc857';c.lineWidth=1;c.strokeRect(left+3,top+4,shape.halfWidth*2-6,shape.height-8);c.fillStyle=f===p?'#69efff':'#ff6d6d';c.beginPath();c.arc(f.x,gy,4,0,Math.PI*2);c.fill();if(f.move&&f.elapsed>=f.move.startup&&f.elapsed<=f.move.startup+f.move.active){c.strokeStyle='#fff16a';c.lineWidth=2;let hy=gy-(f.move.kind==='low'?42:f.move.kind==='air'?82:96);c.strokeRect(f.face>0?f.x:f.x-f.move.range,hy,f.move.range,42)}const phase=attackPhase(f.move,f.elapsed);c.fillStyle='#fff';c.font='11px monospace';c.fillText((f.spriteState||f.state)+' '+(Number.isFinite(f.spriteFrame)?f.spriteFrame+1:'—')+' '+phase+' '+(f.move?f.elapsed.toFixed(2)+'/'+TOTAL(f.move).toFixed(2):''),f.x-shape.halfWidth,top-8)}c.fillStyle='#fff';c.font='12px monospace';c.fillText('DEBUG F3 · body / hurtbox / active hitbox / anchor · frame '+Math.round(game.elapsed*60),12,18)}if(save.settings.reducedMotion){/* visual motion reduced through static poses */}}
function drawCombatArtwork(c,d,x,ground,f){
 // Never draw a whole source sheet as the fighter. If no curated frame exists,
 // return false so drawFighter uses the procedural fallback.
 return !!(spriteRenderer&&f&&spriteRenderer.draw(c,f,x,ground+(f.y||0)));
}
function drawFighter(c,W,H,d,x,y,isPlayer,f){let ground=395+(x-480)*.025;if(spriteRenderer&&f&&spriteRenderer.draw(c,f,x,ground+(f.y||0)))return;let elapsed=f?.anim||0,attack=f?.state==='attack'?f.move:null,wind=attack?Math.sin(Math.min(1,(f.elapsed||0)/Math.max(.01,attack.startup))*Math.PI):0,face=f?.face||1;c.save();c.translate(x,ground+(f?.y||0));c.scale(face,1);if(f?.hitstun>0&&f?.hitstun>.23)c.rotate(-.12);let bob=!save.settings.reducedMotion&&f?.state==='idle'?Math.sin(elapsed*4)*2:0;ellipse(c,0,4,37,8,'#0009');c.translate(0,bob);let leg=d.tone,trim=d.trim,skin=d.skin;c.lineCap='round';c.lineJoin='round';c.strokeStyle='#17121b';c.lineWidth=17;[-1,1].forEach((s,i)=>{c.beginPath();c.moveTo(s*12,-45);let kick=attack&&(attack.kind==='low'||attack.kind==='air')&&i===1?wind*32:0;c.lineTo(s*16+kick,-20);c.lineTo(s*19+kick,-5);c.stroke();c.strokeStyle=leg;c.lineWidth=11;c.beginPath();c.moveTo(s*12,-43);c.lineTo(s*16+kick,-20);c.stroke();c.strokeStyle='#17121b';c.lineWidth=17});c.fillStyle='#111018';c.fillRect(-31,-8,26,9);c.fillRect(9,-8,27,9);c.fillStyle=leg;c.beginPath();c.roundRect(-27,-105,54,65,13);c.fill();c.fillStyle=trim;c.fillRect(-27,-61,54,8);c.fillStyle='#15121a';c.fillRect(-8,-56,16,17);c.strokeStyle=leg;c.lineWidth=15;let armX=attack?40+wind*20:32,armY=attack?-89:-65;c.beginPath();c.moveTo(-22,-91);c.lineTo(-38,-74);c.lineTo(-25,-59);c.stroke();c.beginPath();c.moveTo(22,-91);c.lineTo(armX,-77);c.lineTo(armX+12,armY);c.stroke();ellipse(c,armX+12,armY,9,8,skin);c.fillStyle=skin;ellipse(c,0,-119,20,22,skin);c.fillStyle=d.hair;if(d.gear==='crown'){c.beginPath();c.moveTo(-19,-132);c.lineTo(-17,-147);c.lineTo(-8,-139);c.lineTo(0,-151);c.lineTo(8,-139);c.lineTo(18,-146);c.lineTo(20,-132);c.closePath();c.fill();c.fillStyle=trim;c.fillRect(-20,-134,40,5)}else if(d.gear==='headband'){c.beginPath();c.moveTo(-20,-132);c.quadraticCurveTo(-22,-155,3,-151);c.lineTo(20,-140);c.lineTo(17,-130);c.closePath();c.fill();c.fillStyle=trim;c.fillRect(-20,-137,40,5)}else if(d.gear==='mask'){c.fillStyle=d.tone;c.beginPath();c.ellipse(0,-119,21,23,0,0,7);c.fill();c.fillStyle='#f4e5cc';c.fillRect(-14,-124,10,5);c.fillRect(4,-124,10,5);c.strokeStyle=trim;c.lineWidth=3;c.beginPath();c.moveTo(0,-142);c.lineTo(0,-98);c.moveTo(-19,-120);c.lineTo(18,-120);c.stroke()}else{c.beginPath();c.arc(-1,-125,19,Math.PI,Math.PI*2);c.fill();c.fillStyle=d.hair;c.fillRect(-15,-109,30,10)}c.fillStyle='#211c1c';c.fillRect(5,-119,5,3);c.strokeStyle='#6b3e31';c.lineWidth=1.5;c.beginPath();c.arc(0,-111,6,.25,2.8);c.stroke();if(d.gear==='cape'||d.gear==='crown'){c.fillStyle=d.id==='titan'?'#8c2923':'#76511d';c.beginPath();c.moveTo(-20,-99);c.lineTo(-39,-50);c.lineTo(-23,-38);c.lineTo(-12,-90);c.closePath();c.fill()}c.restore()}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
function effect(c,f){if(!f.move||save.settings.reducedMotion)return;let t=Math.max(0,Math.min(1,(f.elapsed-f.move.startup)/Math.max(.01,f.move.active))),x=f.x+f.face*70,y=395+f.y;c.save();c.globalAlpha=.72;c.lineWidth=5;c.strokeStyle=f.def.trim;c.fillStyle=f.def.tone;if(f.def.id==='viper_dash'){for(let i=1;i<=3;i++){c.globalAlpha=.18;c.strokeStyle='#f2c550';c.strokeRect(f.x-f.face*i*18-20,y-105,40,100)}c.globalAlpha=.9;c.beginPath();c.moveTo(f.x-f.face*70,y-85);c.lineTo(f.x+f.face*40,y-85);c.stroke()}else if(f.def.id==='titan_rex'){c.strokeStyle='#ef6a48';c.lineWidth=7;c.beginPath();c.ellipse(f.x,y,35+t*150,10+t*30,0,0,Math.PI*2);c.stroke();c.strokeStyle='#e7c35b';c.lineWidth=2;c.beginPath();c.ellipse(f.x,y,28+t*133,7+t*26,0,0,Math.PI*2);c.stroke()}else if(f.def.id==='volt_lucha'){c.strokeStyle='#bd84ff';c.lineWidth=3;for(let i=0;i<5;i++){let a=i*1.25+t*8;c.beginPath();c.moveTo(f.x+Math.cos(a)*25,y-115+Math.sin(a)*25);c.lineTo(f.x+Math.cos(a+.45)*72,y-115+Math.sin(a+.45)*45);c.lineTo(f.x+Math.cos(a+.8)*50,y-55+Math.sin(a+.8)*20);c.stroke()}}else if(f.def.id==='nova_blaze'){c.strokeStyle='#d38bff';c.lineWidth=4;c.translate(x,y-88);c.rotate(t*4);for(let i=0;i<8;i++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(0,-8);c.lineTo(0,-28-t*30);c.stroke()}c.strokeStyle='#edc862';c.beginPath();c.arc(0,0,18+t*54,0,Math.PI*2);c.stroke()}else{c.strokeStyle='#f4cc56';c.lineWidth=6;c.beginPath();c.ellipse(f.x,y,30+t*130,9+t*22,0,0,Math.PI*2);c.stroke();c.strokeStyle='#fff0a1';c.lineWidth=2;c.beginPath();c.ellipse(f.x,y,22+t*112,6+t*18,0,0,Math.PI*2);c.stroke()}c.restore()}
function drawPortraits(){document.querySelectorAll('[data-portrait]').forEach(c=>window.drawPortraitFallback(c,c.dataset.portrait))}window.drawPortraitFallback=(canvas,id)=>{let f=roster.find(x=>x.id===id);if(!f)return;let c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/960,canvas.height/500);drawFighter(c,960,500,f,480,0,false);c.restore()}
document.addEventListener('click',e=>{let b=e.target.closest('[data-screen]');if(!b)return;if(b.tagName==='A')e.preventDefault();if(screen==='match'&&game&&!game.finished&&!confirm('Leave this match? No rewards will be settled.'))return;if(screen==='match'&&b.dataset.screen==='fighters')return;setScreen(b.dataset.screen);document.querySelector('#play').scrollIntoView({behavior:'smooth',block:'start'})});let originalRender=render;render=()=>{originalRender();drawPortraits()};
window.addEventListener("beforeunload",e=>{if(game&&!game.finished){e.preventDefault();e.returnValue=""}});persist();render();
})();
