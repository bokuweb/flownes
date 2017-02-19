/* @flow */

import { parse } from '../parser';
import Cpu from '../cpu';
import Ppu from '../ppu';
import Rom from '../rom';
import Ram from '../ram';
import Dma from '../dma';
import CpuBus from '../bus/cpu-bus';
import PpuBus from '../bus/ppu-bus';
import Keypad from '../keypad';
import CanvasRenderer from '../renderer/canvas';
// import log from '../helper/log';

export class NES {
  cpu: Cpu;
  ppu: Ppu;
  cpuBus: CpuBus;
  charactorROM: Rom;
  programROM: Rom;
  ram: Ram;
  ppuBus: PpuBus;
  canvasRenderer: CanvasRenderer;
  keypad: Keypad;
  dma: Dma;

  frame: () => void;

  constructor() {
    this.frame = this.frame.bind(this);
    this.canvasRenderer = new CanvasRenderer('nes');
  }

  //
  // Memory map
  /*
  | addr           |  description               |   mirror       |
  +----------------+----------------------------+----------------+
  | 0x0000-0x07FF  |  RAM                       |                |
  | 0x0800-0x1FFF  |  reserve                   | 0x0000-0x07FF  |
  | 0x2000-0x2007  |  I/O(PPU)                  |                |
  | 0x2008-0x3FFF  |  reserve                   | 0x2000-0x2007  |
  | 0x4000-0x401F  |  I/O(APU, etc)             |                |
  | 0x4020-0x5FFF  |  ex RAM                    |                |
  | 0x6000-0x7FFF  |  battery backup RAM        |                |
  | 0x8000-0xBFFF  |  program ROM LOW           |                |
  | 0xC000-0xFFFF  |  program ROM HIGH          |                |
  */

  setup(nes: ArrayBuffer) {
    const { charactorROM, programROM } = parse(nes);
    this.keypad = new Keypad();
    this.ram = new Ram(2048);
    this.charactorROM = new Rom(charactorROM);
    this.programROM = new Rom(programROM);
    this.ppuBus = new PpuBus(this.charactorROM);
    this.ppu = new Ppu(this.ppuBus);
    this.dma = new Dma(this.ram, this.ppu);
    this.cpuBus = new CpuBus(
      this.ram,
      this.programROM,
      this.charactorROM,
      this.ppu,
      this.keypad,
      this.dma,
    );
    this.cpu = new Cpu(this.cpuBus);
    this.cpu.reset();
  }

  frame() {
    console.time('loop') // eslint-disable-line no-console
    while (true) { // eslint-disable-line no-constant-condition
      let cycle = 0;
      if (this.dma.isDmaProcessing) {
        this.dma.execDma();
        cycle = 514 * 3;
      } else {
        cycle = this.cpu.exec() * 3;
      }
      const { isReady, background, sprites, pallete } = this.ppu.exec(cycle);
      if (isReady) {
        this.canvasRenderer.renderBackground(background, pallete);
        this.canvasRenderer.renderSprites(sprites, pallete);
        break;
      }
    }
    console.timeEnd('loop'); // eslint-disable-line no-console
    requestAnimationFrame(this.frame);
  }

  start() {
    requestAnimationFrame(this.frame);
  }
}
