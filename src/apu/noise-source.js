/* @flow */

export default class NoiseSource {

  context: AudioContext;
  source: AudioBufferSourceNode;
  gain: GainNode;
  playing: boolean;
  bandpass: BiquadFilterNode;

  constructor() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.context = new AudioContext();
    } catch (e) {
      throw new Error('Web Audio isn\'t supported in this browser!');
    }
    this.createSource();
    this.playing = false;
  }

  start() {
    if (this.playing) {
      this.stop();
    }
    this.playing = true;
    this.source.start(0);
  }

  stop() {
    if (this.playing) {
      this.playing = false;
      this.source.stop(this.context.currentTime);
      this.createSource();
    }
  }

  createSource() {
    const node = this.context.createBufferSource();
    const buffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < this.context.sampleRate; i++) {
      data[i] = Math.random();
    }
    node.buffer = buffer;
    node.loop = true;
    this.gain = this.context.createGain();
    this.gain.gain.value = 0.1;
    node.connect(this.gain);
    this.bandpass = this.context.createBiquadFilter();
    this.bandpass.frequency.value = 440;
    this.bandpass.type = 'bandpass';
    this.bandpass.Q.value = 500;
    this.gain.connect(this.bandpass);
    this.bandpass.connect(this.context.destination);
    this.source = node;
  }

  setVolume(volume: number) {
    volume = Math.max(0, Math.min(1, volume));
    this.gain.gain.value = volume;
  }

  setFrequency(frequency: number) {
    console.log('aaa')
    this.bandpass.frequency.value = frequency;
  }
}
