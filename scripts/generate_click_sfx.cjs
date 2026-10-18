const fs = require('fs');
const path = require('path');

// Generate a juicy, crisp UI button click sound in WAV format (44.1kHz, 16-bit mono)
function createClickWav() {
  const sampleRate = 44100;
  const duration = 0.045; // 45ms snappy click
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Synthesize:
  // 1. Transient click: high-frequency noise & snap in first 3ms
  // 2. Body: frequency slide from 900Hz to 180Hz with steep exponential envelope
  // 3. Resonance: slight harmonic at 1.8kHz for wooden/arcade tactile click feel
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // Snappy envelope (fast attack 0.5ms, steep decay)
    let attack = t < 0.001 ? t / 0.001 : 1.0;
    let decay = Math.exp(-progress * 14);
    let env = attack * decay;

    // Pitch sweep (900 Hz down to 220 Hz)
    const freq = 220 + 680 * Math.exp(-progress * 18);
    const phase = 2 * Math.PI * freq * t;
    const bodyTone = Math.sin(phase);

    // Click transient (first 4ms)
    let clickTransient = 0;
    if (t < 0.004) {
      const clickEnv = 1 - (t / 0.004);
      const clickNoise = (Math.random() * 2 - 1) * 0.35;
      const clickTone = Math.sin(2 * Math.PI * 3200 * t) * 0.65;
      clickTransient = (clickNoise + clickTone) * clickEnv;
    }

    // Gentle tactile pop tone (harmonics)
    const subTone = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.25;

    let sampleVal = (bodyTone * 0.6 + subTone + clickTransient * 0.5) * env;
    sampleVal = Math.max(-1, Math.min(1, sampleVal * 0.85));

    const intVal = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  return buffer;
}

const wavBuffer = createClickWav();
const outPathWav = path.join(__dirname, '..', 'public', 'assets', 'audio', 'sfx_btn_click.wav');
const outPathMp3 = path.join(__dirname, '..', 'public', 'assets', 'audio', 'sfx_btn_click.mp3');

fs.writeFileSync(outPathWav, wavBuffer);
// Also write to mp3 path as backup fallback so existing references work smoothly
fs.writeFileSync(outPathMp3, wavBuffer);

console.log(`Generated click SFX: ${outPathWav} (${wavBuffer.length} bytes)`);
