// ====================================================
// MOONU'S SURPRISE - BIOMETRIC LOVE REACTOR JS ENGINE
// ====================================================

// DOM Elements
const heartWrapper = document.getElementById('heartWrapper');
const ck1 = document.getElementById('ck1');
const ck2 = document.getElementById('ck2');
const ck3 = document.getElementById('ck3');
const scannerBtn = document.getElementById('scannerBtn');
const progressTrack = document.getElementById('progressTrack');
const hudStatus = document.getElementById('hudStatus');
const statusLabel = document.getElementById('statusLabel');
const powerMetric = document.getElementById('powerMetric');
const tempMetric = document.getElementById('tempMetric');
const voltageMetric = document.getElementById('voltageMetric');
const scannerPrompt = document.getElementById('scannerPrompt');
const overloadBanner = document.getElementById('overloadBanner');
const rechargeBtn = document.getElementById('rechargeBtn');
const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.getElementById('soundIcon');
const flashOverlay = document.getElementById('flashOverlay');
const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');

// State Variables
let isCharging = false;
let chargeProgress = 0; // 0.0 to 1.0
let chargeStartTime = 0;
const CHARGE_DURATION = 2600; // ms to reach 100%
let isOverloaded = false;
let soundEnabled = true;
const RING_CIRCUMFERENCE = 2 * Math.PI * 68; // 427.26

// Particle & FX Arrays
let particles = [];
let lightningArcs = [];
let shockwaves = [];
let lastFrameTime = performance.now();

// ====================================================
// WEB AUDIO SYNTHESIZER (Zero external sound files)
// ====================================================
let audioCtx = null;
let chargeOscillator = null;
let chargeGainNode = null;
let noiseNode = null;
let noiseGainNode = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Sound toggle handler
soundToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
  if (!soundEnabled) {
    stopChargingAudio(false);
  }
});

// Play cute chime on word click
function playChime(freq = 520) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.36);
}

// Start rising charging hum & electric crackle
function startChargingAudio() {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // Primary charging tone (Sawtooth with Lowpass Filter)
  chargeOscillator = audioCtx.createOscillator();
  chargeGainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  chargeOscillator.type = 'sawtooth';
  chargeOscillator.frequency.setValueAtTime(80, now);
  chargeOscillator.frequency.exponentialRampToValueAtTime(880, now + CHARGE_DURATION / 1000);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(4500, now + CHARGE_DURATION / 1000);

  chargeGainNode.gain.setValueAtTime(0.01, now);
  chargeGainNode.gain.linearRampToValueAtTime(0.25, now + 0.3);

  chargeOscillator.connect(filter);
  filter.connect(chargeGainNode);
  chargeGainNode.connect(audioCtx.destination);
  chargeOscillator.start();

  // Noise generator for plasma crackle
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1200;
  noiseFilter.Q.value = 3;

  noiseGainNode = audioCtx.createGain();
  noiseGainNode.gain.setValueAtTime(0.01, now);
  noiseGainNode.gain.linearRampToValueAtTime(0.08, now + CHARGE_DURATION / 1000);

  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGainNode);
  noiseGainNode.connect(audioCtx.destination);
  noiseNode.start();
}

// Stop charging audio
function stopChargingAudio(isComplete = false) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (chargeGainNode) {
    chargeGainNode.gain.cancelScheduledValues(now);
    chargeGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.15);
  }
  if (chargeOscillator) {
    chargeOscillator.stop(now + 0.16);
    chargeOscillator = null;
  }
  if (noiseGainNode) {
    noiseGainNode.gain.cancelScheduledValues(now);
    noiseGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.15);
  }
  if (noiseNode) {
    noiseNode.stop(now + 0.16);
    noiseNode = null;
  }

  if (isComplete && soundEnabled) {
    playDetonationSfx();
  }
}

// Massive Sub-bass 808 drop & Supernova detonation sound
function playDetonationSfx() {
  if (!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;

  // 1. Sub-Bass 808 Drop
  const subOsc = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(160, now);
  subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

  subGain.gain.setValueAtTime(0.7, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

  subOsc.connect(subGain);
  subGain.connect(audioCtx.destination);
  subOsc.start(now);
  subOsc.stop(now + 1.45);

  // 2. High-energy Shimmer Chord
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
    const chordOsc = audioCtx.createOscillator();
    const chordGain = audioCtx.createGain();
    chordOsc.type = 'triangle';
    chordOsc.frequency.setValueAtTime(freq, now);
    chordGain.gain.setValueAtTime(0.15, now + idx * 0.04);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    chordOsc.connect(chordGain);
    chordGain.connect(audioCtx.destination);
    chordOsc.start(now + idx * 0.04);
    chordOsc.stop(now + 1.85);
  });
}

// ====================================================
// WORD CHECKING & HEART FORM LOGIC
// ====================================================
function check() {
  initAudio();
  playChime(350 + Math.random() * 200);

  const allChecked = ck1.checked && ck2.checked && ck3.checked;

  if (allChecked) {
    if (!heartWrapper.classList.contains('throb')) {
      heartWrapper.classList.add('throb');
    }
    if (!isOverloaded) {
      statusLabel.textContent = 'HEART ASSEMBLED • HOLD TO OVERCHARGE';
      statusLabel.style.color = '#ff99cc';
    }
  } else {
    if (heartWrapper.classList.contains('throb') && !isOverloaded) {
      heartWrapper.classList.remove('throb');
    }
    if (!isOverloaded) {
      statusLabel.textContent = 'SYSTEM READY • HOLD TO CHARGE';
      statusLabel.style.color = '#e0f2fe';
    }
  }
}

// ====================================================
// BIOMETRIC CHARGING ENGINE
// ====================================================
function startCharging(e) {
  if (e) e.preventDefault();
  if (isOverloaded) return;

  initAudio();
  isCharging = true;
  chargeStartTime = performance.now() - (chargeProgress * CHARGE_DURATION);
  scannerBtn.classList.add('charging');
  statusLabel.textContent = 'CHARGING LOVE REACTOR...';
  statusLabel.style.color = 'var(--neon-cyan)';
  startChargingAudio();

  // Trigger brief touch haptic on start
  if (navigator.vibrate) {
    navigator.vibrate(40);
  }
}

function stopCharging(e) {
  if (!isCharging) return;
  isCharging = false;
  scannerBtn.classList.remove('charging');

  if (chargeProgress < 1.0) {
    stopChargingAudio(false);
    statusLabel.textContent = 'CHARGE INTERRUPTED • HOLD FIRMLY';
    statusLabel.style.color = '#ffb703';
    voltageMetric.textContent = 'DISCHARGING';
    voltageMetric.style.color = '#ffb703';
  }
}

// Attach Pointer & Touch Listeners to Scanner Pad
scannerBtn.addEventListener('pointerdown', startCharging);
scannerBtn.addEventListener('pointerup', stopCharging);
scannerBtn.addEventListener('pointercancel', stopCharging);
scannerBtn.addEventListener('pointerleave', stopCharging);
scannerBtn.addEventListener('contextmenu', (e) => e.preventDefault());

// ====================================================
// OVERLOAD DETONATION (100% Climax)
// ====================================================
function triggerOverloadDetonation() {
  isOverloaded = true;
  isCharging = false;
  chargeProgress = 1.0;
  scannerBtn.classList.remove('charging');
  stopChargingAudio(true);

  // 1. Auto-check all boxes so full heart forms immediately
  ck1.checked = true;
  ck2.checked = true;
  ck3.checked = true;

  // 2. Supercharge Heart
  heartWrapper.classList.add('throb', 'supercharged');
  document.body.classList.add('overloaded');

  // 3. Screen Rumble & Neon Flash
  document.body.classList.add('screen-shake');
  setTimeout(() => document.body.classList.remove('screen-shake'), 650);

  flashOverlay.classList.add('active');
  setTimeout(() => flashOverlay.classList.remove('active'), 350);

  // 4. Update HUD Telemetry
  statusLabel.textContent = '⚡ 100% REACTOR OVERLOAD DETECTED ⚡';
  statusLabel.style.color = '#ff1a75';
  powerMetric.textContent = '100% MAX';
  powerMetric.style.color = '#ff1a75';
  tempMetric.textContent = '🔥 999°C';
  tempMetric.style.color = '#ff0055';
  voltageMetric.textContent = 'INFINITY';
  voltageMetric.style.color = '#00f0ff';
  scannerPrompt.style.display = 'none';

  // 5. Spawn Supernova Particle Burst on Canvas
  const rect = heartWrapper.getBoundingClientRect();
  const heartCenterX = rect.left + rect.width / 2;
  const heartCenterY = rect.top + rect.height / 2;

  // Shockwave Rings
  shockwaves.push(
    { x: heartCenterX, y: heartCenterY, radius: 10, maxRadius: Math.max(canvas.width, canvas.height) * 0.8, alpha: 1, speed: 22, color: '#ff1a75' },
    { x: heartCenterX, y: heartCenterY, radius: 10, maxRadius: Math.max(canvas.width, canvas.height) * 0.9, alpha: 1, speed: 16, color: '#00f0ff' }
  );

  // 200+ Supernova Particles
  for (let i = 0; i < 220; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 4;
    const isHeart = Math.random() > 0.45;
    particles.push({
      x: heartCenterX,
      y: heartCenterY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 16 + 8,
      color: ['#ff1a75', '#ff0055', '#ff99cc', '#00f0ff', '#ffb703', '#ffffff'][Math.floor(Math.random() * 6)],
      alpha: 1,
      decay: Math.random() * 0.012 + 0.006,
      gravity: 0.08,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      isHeart: isHeart
    });
  }

  // 6. Mobile Haptic Vibration Pattern
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 400]);
  }

  // 7. Show Victory Declaration Banner
  setTimeout(() => {
    overloadBanner.style.display = 'block';
  }, 400);
}

// Recharge / Reset Handler
rechargeBtn.addEventListener('click', () => {
  isOverloaded = false;
  chargeProgress = 0;
  progressTrack.style.strokeDashoffset = RING_CIRCUMFERENCE;
  overloadBanner.style.display = 'none';
  scannerPrompt.style.display = 'flex';
  document.body.classList.remove('overloaded');
  heartWrapper.classList.remove('supercharged');

  powerMetric.textContent = '0%';
  powerMetric.style.color = '#fff';
  tempMetric.textContent = '36.5°C';
  tempMetric.style.color = '#fff';
  voltageMetric.textContent = 'STANDBY';
  voltageMetric.style.color = '#fff';
  statusLabel.textContent = 'SYSTEM READY • HOLD TO CHARGE';
  statusLabel.style.color = '#e0f2fe';

  // Keep checkboxes checked or let them re-throb
  check();
  playChime(600);
});

// ====================================================
// CANVAS PARTICLES & LIGHTNING ANIMATION LOOP
// ====================================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawLightning(x1, y1, x2, y2, color = '#00f0ff') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.random() * 3 + 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.moveTo(x1, y1);

  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const midX = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 35;
    const midY = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
    ctx.lineTo(midX, midY);
  }

  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function renderFrame(now) {
  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Update Charge Progress
  if (isCharging && !isOverloaded) {
    const elapsed = now - chargeStartTime;
    chargeProgress = Math.min(1.0, elapsed / CHARGE_DURATION);

    // Update Progress Ring
    const offset = RING_CIRCUMFERENCE * (1 - chargeProgress);
    progressTrack.style.strokeDashoffset = offset;

    // Update HUD Values
    powerMetric.textContent = `${Math.floor(chargeProgress * 100)}%`;
    const temp = (36.5 + chargeProgress * 63.5).toFixed(1);
    tempMetric.textContent = `${temp}°C`;

    if (chargeProgress > 0.8) {
      voltageMetric.textContent = 'CRITICAL SURGE';
      voltageMetric.style.color = '#ff1a75';
    } else if (chargeProgress > 0.4) {
      voltageMetric.textContent = 'CHARGING';
      voltageMetric.style.color = '#00f0ff';
    } else {
      voltageMetric.textContent = 'INITIATED';
      voltageMetric.style.color = '#e0f2fe';
    }

    // Generate Electric Plasma Arcs between Scanner Pad & Heart
    const heartRect = heartWrapper.getBoundingClientRect();
    const scannerRect = scannerBtn.getBoundingClientRect();

    const scannerX = scannerRect.left + scannerRect.width / 2;
    const scannerY = scannerRect.top + scannerRect.height / 2;
    const heartX = heartRect.left + heartRect.width / 2;
    const heartY = heartRect.top + heartRect.height / 2;

    const arcCount = Math.floor(chargeProgress * 4) + 1;
    for (let a = 0; a < arcCount; a++) {
      drawLightning(
        scannerX + (Math.random() - 0.5) * 40,
        scannerY + (Math.random() - 0.5) * 20,
        heartX + (Math.random() - 0.5) * 60,
        heartY + (Math.random() - 0.5) * 60,
        Math.random() > 0.3 ? '#00f0ff' : '#ff1a75'
      );
    }

    // Spark Particles around scanner pad
    if (Math.random() > 0.3) {
      particles.push({
        x: scannerX + (Math.random() - 0.5) * 70,
        y: scannerY + (Math.random() - 0.5) * 70,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6 - 2,
        size: Math.random() * 4 + 2,
        color: '#00f0ff',
        alpha: 1,
        decay: 0.04,
        gravity: 0.05,
        rotation: 0,
        rotSpeed: 0,
        isHeart: false
      });
    }

    // Check for 100% completion
    if (chargeProgress >= 1.0) {
      triggerOverloadDetonation();
    }
  } else if (!isCharging && !isOverloaded && chargeProgress > 0) {
    // Discharge back smoothly
    chargeProgress = Math.max(0, chargeProgress - dt * 1.5);
    const offset = RING_CIRCUMFERENCE * (1 - chargeProgress);
    progressTrack.style.strokeDashoffset = offset;
    powerMetric.textContent = `${Math.floor(chargeProgress * 100)}%`;
    tempMetric.textContent = `${(36.5 + chargeProgress * 63.5).toFixed(1)}°C`;
  }

  // 2. Render & Update Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += sw.speed;
    sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

    ctx.save();
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 6 * sw.alpha;
    ctx.shadowColor = sw.color;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = sw.alpha;
    ctx.stroke();
    ctx.restore();

    if (sw.alpha <= 0.01 || sw.radius >= sw.maxRadius) {
      shockwaves.splice(i, 1);
    }
  }

  // 3. Render & Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.rotation += p.rotSpeed;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.isHeart) {
      ctx.font = `${p.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💖', 0, 0);
    } else {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  requestAnimationFrame(renderFrame);
}

// Start Animation Loop
requestAnimationFrame(renderFrame);
