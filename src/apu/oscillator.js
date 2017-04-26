/* @flow */

export default class Oscillator {

  context: AudioContext;
  oscillator: OscillatorNode;
  gain: GainNode;
  playing: boolean;

  constructor() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.context = new AudioContext();
    } catch (e) {
      throw new Error('Web Audio isn\'t supported in this browser!');
    }
    this.oscillator = this.createOscillator({ global_gain: 1 });
    this.setPulseWidth(0.5);
    // this.oscillators.PWM2 = createOscillator({ global_gain: 0.25 })
    // this.setPulseWidth('PWM2', 0.5)
    // this.oscillators.TRIANGLE = this.createOscillator({ type: 'triangle' })
    // this.oscillators.NOISE = createNoiseOscillator()
    // Object.keys(this.oscillators).forEach(key => this.oscillators[key].oscillator.start(0));
    // this.oscillator.start(0);
    this.playing = false;
  }

  start() {
    if (this.playing) {
      this.stop();
    }
    this.playing = true;
    this.oscillator.start(0);
  }

  stop() {
    if (this.playing) {
      this.playing = false;
      this.oscillator.stop(this.context.currentTime);
      this.oscillator = this.createOscillator();
      this.setPulseWidth(0.5);
    }
  }

  createOscillator(options = {}) {
    const oscillator = this.context.createOscillator()

    if (options.frequency) oscillator.frequency.value = options.frequency;
    // if (options.type) oscillator.type = options.type

    if (options.harmonics) {
      /* eslint-disable no-undef */
      const waveform = this.context.createPeriodicWave(
        new Float32Array(options.harmonics.real),
        new Float32Array(options.harmonics.imag)
      )
      oscillator.setPeriodicWave(waveform);
    }

    // var gain = context.createGain()
    // gain.gain.value = 0
// 
    // // Some wave forms are simply louder, so we add a global gain option for basic mixing
    // var globalGain = context.createGain()
    // globalGain.gain.value = options.global_gain || 1
// 
    // oscillator.connect(gain)
    // gain.connect(globalGain)
    // globalGain.connect(context.destination)

    this.gain = this.context.createGain();
    this.gain.gain.value = 0.5
    const globalGain = this.context.createGain()
    globalGain.gain.value = options.global_gain || 1

    oscillator.connect(this.gain);
    this.gain.connect(globalGain);
    globalGain.connect(this.context.destination);
    return oscillator;
  }

  setPulseWidth(pulseWidth: number) {
    const real = [0]
    const imag = [0]
    for (let i = 1; i < 8192; i += 1) {
      const realTerm = 4 / (i * Math.PI) * Math.sin(Math.PI * i * pulseWidth);
      real.push(realTerm);
      imag.push(0);
    }
    this.oscillator.setPeriodicWave(
      /* eslint-disable no-undef */
      this.context.createPeriodicWave(new Float32Array(real), new Float32Array(imag)),
    )
  }

  setFrequency(frequency: number) {
    this.oscillator.frequency.value = frequency;
  }

  changeFrequency(frequency: number) {
    // if (oscillatorIndex === 'NOISE') {
    //  this.oscillator.bandpass.frequency.value = frequency
    //  return
    // }
    this.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime)
  }

  setVolume(volume: number) {
    volume = Math.max(0, Math.min(1, volume));
    this.gain.gain.value = volume;
  }
}
