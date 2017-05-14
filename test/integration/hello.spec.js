import { screenshot } from 'karma-nightmare';
import { NES } from '../../src/nes';

describe('integration hello spec', () => {

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="nes" width="400" height="300"></canvas>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render hello world', (done) => {
    const fs = window.require('fs');
    const nesFile = fs.readFileSync('static/roms/hello.nes');
    const nes = new NES();
    nes.setup(nesFile);
    nes.start();
    setTimeout(() => {
      screenshot('screenshot/actual/hello.png').then(done);
    }, 1000);
  });

  it('should render sprite', (done) => {
    const fs = window.require('fs');
    const nesFile = fs.readFileSync('static/roms/giko005.nes');
    const nes = new NES();
    nes.setup(nesFile);
    nes.start();
    setTimeout(() => {
      screenshot('screenshot/actual/giko005.png').then(done);
    }, 1000);
  });  
});

