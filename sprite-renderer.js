export class SpriteRenderer {
  constructor(manifest, base = 'assets/fighters/') { this.manifest=manifest; this.base=base; this.frames=new Map(); this.failed=new Set(); }
  stateFor(f) {
    if (f.state==='attack' && f.move) return f.move.id==='special'?'special':f.move.id==='punch'?'jab':f.move.id;
    if (f.state==='knockdown') return 'knockdown'; if (f.state==='recovery') return 'recovery';
    if (f.state==='landing') return 'landing'; if (f.state==='victory') return 'victory'; if (f.state==='defeat') return 'defeat';
    if (f.state==='hit') return 'hit_reaction'; if (f.state==='block') return 'block';
    if (f.state==='crouch') return 'crouch_idle'; if (f.state==='jump') return f.vy< -30?'jump_rise':f.vy>30?'jump_fall':'jump_apex';
    if (Math.abs(f.vx)>0.5) return Math.abs(f.vx)>f.def.move*.78?'run':'walk'; return 'idle';
  }
  draw(ctx,f,x,y) {
    const fighter=this.manifest.fighters.find(v=>v.id===f.def.id), state=this.stateFor(f), spec=this.manifest.states[state];
    if (!fighter?.spriteReady || !spec || (Array.isArray(fighter.availableStates) && !fighter.availableStates.includes(state)) || this.failed.has(`${f.def.id}:${state}`)) return false;
    const arr=this.load(f.def.id,state,spec.frames); if(!arr || arr.length!==spec.frames) return false;
    const elapsed=f.animState===state?f.animElapsed||0:(f.animElapsed=0,f.animState=state,0); f.animElapsed=(elapsed||0)+1/60;
    let i;
    if(f.state==='attack'&&f.move){const m=f.move;let progress;if(f.elapsed<m.startup)progress=.25*f.elapsed/Math.max(.001,m.startup);else if(f.elapsed<m.startup+m.active)progress=.25+.43*(f.elapsed-m.startup)/Math.max(.001,m.active);else progress=.68+.32*(f.elapsed-m.startup-m.active)/Math.max(.001,m.recover);i=Math.floor(Math.max(0,Math.min(.999,progress))*arr.length)}
    else {i=Math.floor(f.animElapsed*1000/spec.durationMs);if(spec.loop)i%=arr.length;else i=Math.min(arr.length-1,i)}
    const img=arr[i]; if(!img?.complete||!img.naturalWidth)return false;
    ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+3,27,7,0,0,Math.PI*2);ctx.fill();ctx.translate(x,y);ctx.scale((f.face||1)*.32,.32);ctx.drawImage(img,-256,-448,512,512);ctx.restore();return true;
  }
  load(id,state,count) {
    const key=`${id}:${state}`;if(this.frames.has(key))return this.frames.get(key);const out=[];this.frames.set(key,out);
    for(let n=1;n<=count;n++){const img=new Image();img.onerror=()=>{this.failed.add(key);this.frames.delete(key)};img.src=`${this.base}${id}/${state}/frame_${String(n).padStart(3,'0')}.png`;out.push(img);}return out;
  }
}
