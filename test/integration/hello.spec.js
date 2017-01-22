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
    const require = window.require || window.parent.require;
    const fs = require('fs');
    const nesFile = fs.readFileSync('static/roms/hello.nes');
    const nes = new NES();
    nes.setup(nesFile);
    nes.start();
    setTimeout(() => {
      screenshot('screenshot/actual/hello.png').then(done);
    }, 100);
  });
});

