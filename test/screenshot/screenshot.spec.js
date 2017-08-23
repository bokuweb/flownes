import test from 'ava';
import { screenshot } from 'avaron';
import { NES } from '../../src/nes';

test.beforeEach(() => {
  document.body.innerHTML = '<canvas id="nes" width="400" height="300"></canvas>';
});

test.afterEach(() => {
  document.body.innerHTML = '';
});

test.serial('should render hello world', async t => {
  const fs = window.require('fs');
  const nesFile = fs.readFileSync('static/roms/hello.nes');
  const nes = new NES();
  nes.load(nesFile);
  nes.start();
  await (() => new Promise((done) => setTimeout(() => {
    nes.close();
    screenshot('screenshot/actual/hello.png').then(done);
  }, 500)))();
  t.pass();
});

test.serial('should render sprite', async t => {
  const fs = window.require('fs');
  const nesFile = fs.readFileSync('static/roms/giko005.nes');
  const nes = new NES();
  nes.load(nesFile);
  nes.start();
  await (() => new Promise((done) => setTimeout(() => {
    screenshot('screenshot/actual/giko005.png').then(done);
    nes.close();
  }, 500)))();
  t.pass();
});

test.serial('should render road game', async t => {
  const fs = window.require('fs');
  const nesFile = fs.readFileSync('static/roms/giko016.nes');
  const nes = new NES();
  nes.load(nesFile);
  nes.start();
  await (() => new Promise((done) => setTimeout(() => {
    screenshot('screenshot/actual/giko016.png').then(done);
    nes.close();
  }, 500)))();
  t.pass();
});

test.serial('should render horizontal scroll game', async t => {
  const fs = window.require('fs');
  const nesFile = fs.readFileSync('static/roms/giko017.nes');
  const nes = new NES();
  nes.load(nesFile);
  nes.start();
  await (() => new Promise((done) => setTimeout(() => {
    screenshot('screenshot/actual/giko017.png').then(done);
    nes.close();
  }, 500)))();
  t.pass();
});

test.serial('should render 018', async t => {
  const fs = window.require('fs');
  const nesFile = fs.readFileSync('static/roms/giko018.nes');
  const nes = new NES();
  nes.load(nesFile);
  nes.start();
  await (() => new Promise((done) => setTimeout(() => {
    screenshot('screenshot/actual/giko018.png').then(done);
    nes.close();
  }, 500)))();
  t.pass();
});

test.serial('should render color bar', async t => {
  const fs = window.require('fs');
  const nesFile = fs.readFileSync('static/roms/color-bars-mapper0.nes');
  const nes = new NES();
  nes.load(nesFile);
  nes.start();
  await (() => new Promise((done) => setTimeout(() => {
    screenshot('screenshot/actual/color-bars-mapper0.png').then(done);
    nes.close();
  }, 500)))();
  t.pass();
});

test.serial('should render nestest', async t => {
  const fs = window.require('fs');
  const nesFile = fs.readFileSync('static/roms/nestest.nes');
  const nes = new NES();
  nes.load(nesFile);
  nes.start();

  setTimeout(() => {
    const e = new Event('keydown');
    e.key = 'S';
    e.keyCode = e.key.charCodeAt(0);
    e.which = e.key.charCodeAt(0);
    e.altKey = false;
    e.ctrlKey = false;
    e.shiftKey = false;
    e.metaKey = false;
    document.dispatchEvent(e);
  }, 500);

  await (() => new Promise((done) => setTimeout(() => {
    screenshot('screenshot/actual/nestest.png').then(done);
    nes.close();
  }, 2000)))();
  t.pass();
});


