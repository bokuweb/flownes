import { screenshot } from 'karma-nightmare';
import { NES } from '../../src/nes';

describe('integration hello spec', () => {

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="nes" width="400" height="300"></canvas>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render hello world', function (done) {
    this.timeout(5000);
    const fs = window.require('fs');
    const nesFile = fs.readFileSync('static/roms/hello.nes');
    const nes = new NES();
    nes.setup(nesFile);
    nes.start();
    setTimeout(() => {
      screenshot('screenshot/actual/hello.png').then(done);
      nes.close();
    }, 500);
  });

  it('should render sprite', function (done) {
    this.timeout(5000);
    const fs = window.require('fs');
    const nesFile = fs.readFileSync('static/roms/giko005.nes');
    const nes = new NES();
    nes.setup(nesFile);
    nes.start();
    setTimeout(() => {
      screenshot('screenshot/actual/giko005.png').then(done);
      nes.close();
    }, 500);
  });

  it('should render road game', function (done) {
    this.timeout(5000);
    const fs = window.require('fs');
    const nesFile = fs.readFileSync('static/roms/giko016.nes');
    const nes = new NES();
    nes.setup(nesFile);
    nes.start();
    setTimeout(() => {
      screenshot('screenshot/actual/giko016.png').then(done);
      nes.close();
    }, 500);
  });

  it('should render horizontal scroll game', function (done) {
    this.timeout(5000);
    const fs = window.require('fs');
    const nesFile = fs.readFileSync('static/roms/giko017.nes');
    const nes = new NES();
    nes.setup(nesFile);
    nes.start();
    setTimeout(() => {
      screenshot('screenshot/actual/giko017.png').then(done);
      nes.close();
    }, 500);
  });
});

