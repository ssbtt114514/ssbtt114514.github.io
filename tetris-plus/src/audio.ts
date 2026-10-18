/** WebAudio 合成音效（无版权素材）；移动端需首次触摸解锁 */
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  try { if (!ctx) ctx = new AudioContext(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch { return null; }
}
function beep(freq: number, dur = 0.08, type: OscillatorType = 'square', gain = 0.04, delay = 0) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur + 0.02);
}
export const sfx = {
  unlock: () => { ac(); },
  lock: () => beep(220, 0.05),
  clear: () => { beep(523, 0.07); beep(659, 0.07, 'square', 0.04, 0.06); },
  stage: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.12, 'triangle', 0.06, i * 0.1)),
  boom: () => { beep(90, 0.25, 'sawtooth', 0.08); beep(60, 0.3, 'square', 0.06, 0.03); },
  event: () => { beep(440, 0.1, 'triangle', 0.06); beep(330, 0.12, 'triangle', 0.06, 0.1); },
  over: () => [392, 330, 262, 196].forEach((f, i) => beep(f, 0.16, 'triangle', 0.06, i * 0.15)),
  click: () => beep(880, 0.03, 'square', 0.03)
};