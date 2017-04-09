export default class SquareSource {

  constructor() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();

  }

  setFrequency(f: number) {
    this.frequency = f;
  }

  start() {
    console.log('start')
    // this.context.sampleRate = 48000
    this.node = this.context.createScriptProcessor(0, 1, 1);
    this.node.onaudioprocess = (e) => {
      console.log('onProcess', e);
      // that.process(e);
      var data = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(i);
        if ((i % 100) < 50) {
          data[i] = 1.0 / 2;
        } else {
          data[i] = -1.0 / 2;
        }
      }
    };

    // const buf = this.context.createBuffer(1, 48000, this.frequency);
    // const data = buf.getChannelData(0);
    // for (let i = 0; i < data.length; i++) {
    //   data[i] = Math.sin(i);
    //   if ((i % 100) < 50) {
    //     data[i] = 1.0 / 2;
    //   } else {
    //     data[i] = -1.0 / 2;
    //   }
    // }
    //this.src = this.context.createBufferSource();
    // this.src.buffer = buf;
    // this.src.connect(this.context.destination);
    // this.src.start();
    this.node.connect(this.context.destination);
    // this.node.start();    
  }

  stop() {
    console.log('stop')
    if (!this.src) return;
    this.src.stop();
  }
}
