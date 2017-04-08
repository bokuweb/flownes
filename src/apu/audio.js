export default class SquareSource {

  constructor() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
  }

  setFrequency(f) {
    // freq = 32 * (register + 1) / CPUclcok
    this.frequency = f;
  }

  start() {
    console.log('start')
    const buf = this.context.createBuffer(1, 48000, this.frequency);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(i);
      if ((i % 100) < 50) {
        data[i] = 1.0 / 2;
      } else {
        data[i] = -1.0 / 2;
      }
    }
    const src = this.context.createBufferSource();
    src.buffer = buf;
    src.connect(this.context.destination);
    src.start();
  }

  stop() {
    if (!this.src) return;
    this.src.stop();
  }x
}
