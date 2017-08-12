/* eslint-disable */

const fs = require('fs');
const path = require('path');
const width = [0.125, 0.25, 0.5, 0.75];

const create = (pulseWidth) => {
  const real = [0]
  const imag = [0]
  for (let i = 1; i < 8192; i += 1) {
    const realTerm = 4 / (i * Math.PI) * Math.sin(Math.PI * i * pulseWidth);
    real.push(realTerm);
    imag.push(0);
  }
  return { real, imag };
};

const ws = width.map(w => create(w));


const json = `export default {
  '0.125': {
    real: new Float32Array([${ws[0].real.toString()}]),  
    imag: new Float32Array([${ws[0].real.toString()}]),  
  },
  '0.25': {
    real: new Float32Array([${ws[1].real.toString()}]),  
    imag: new Float32Array([${ws[1].real.toString()}]),  
  },
  '0.5': {
    real: new Float32Array([${ws[2].real.toString()}]),  
    imag: new Float32Array([${ws[2].real.toString()}]),      
  },
  '0.75': {
    real: new Float32Array([${ws[3].real.toString()}]),  
    imag: new Float32Array([${ws[3].real.toString()}]),    
  },
}`

fs.writeFileSync(path.resolve(__dirname, '../src/apu/pulse.js'), json);

