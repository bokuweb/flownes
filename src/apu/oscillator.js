export default class Oscillator {

  constructor() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.context = new AudioContext();
    } catch (e) {
      throw new Error('Web Audio isn\'t supported in this browser!');
    }
    // this.oscillators = {};
    // initialize oscillators
    this.oscillator = this.createOscillator();
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
      this.oscillator = this.createOscillator();
      this.setPulseWidth(0.5);
    }
    this.playing = true;
    this.oscillator.start(0);
  }

  stop() {
    console.log('stop');
    this.playing = false;
    this.oscillator.stop(this.context.currentTime);
  }

  createOscillator(options = {}) {
    const oscillator = this.context.createOscillator()

    if (options.frequency) oscillator.frequency.value = options.frequency;
    // if (options.type) oscillator.type = options.type

    if (options.harmonics) {
      const waveform = this.context.createPeriodicWave(
        new Float32Array(options.harmonics.real),
        new Float32Array(options.harmonics.imag)
      )
      oscillator.setPeriodicWave(waveform);
    }

    // this.gain = this.context.createGain();
    // this.gain.gain.value = 0
    // const globalGain = this.context.createGain()
    // globalGain.gain.value = options.global_gain || 1

    oscillator.connect(this.context.destination)
    // this.gain.connect(globalGain)
    // lobalGain.connect(this.context.destination)
    return oscillator;
  }

  setPulseWidth(pulseWidth) {
    // calculate the harmonics for the passed (clamped) pulse width
    pulseWidth = Math.max(0, Math.min(1, pulseWidth));
    const real = [0]
    const imag = [0]
    for (let i = 1; i < 8192; i++) {
      const realTerm = 4 / (i * Math.PI) * Math.sin(Math.PI * i * pulseWidth);
      real.push(realTerm);
      imag.push(0);
    }
    this.oscillator.setPeriodicWave(
      this.context.createPeriodicWave(new Float32Array(real), new Float32Array(imag)),
    )
  }

  /**
   * Set the pitch of a particular oscillator
   * @param {String} oscillatorIndex The oscillator to set for (PWM1, PWM2, NOISE, TRIANGLE)
   * @param {Number} frequency The frequency in Hz to set to
   * @param {Number} volume The volume to set to (0 - 1)
   */

  setFrequency(frequency) {
    console.log(frequency)
    this.oscillator.frequency.value = frequency;
  }

  changeFrequency(frequency) {
    // if (oscillatorIndex === 'NOISE') {
    //  this.oscillator.bandpass.frequency.value = frequency
    //  return
    // }
    this.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime)
  }

  setVolume(volume) {
    volume = Math.max(0, Math.min(1, volume));
    this.oscillator.gain.gain.value = volume;
  }
}
