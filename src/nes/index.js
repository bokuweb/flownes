/* @flow */

import { parse } from '../parser';
import CPU from '../cpu';
import PPU from '../ppu';
import ROM from '../rom';
import RAM from '../ram';
import Bus from '../bus';
// import log from '../helper/log';vsc 

import type { Word } from '../types/common';

export class NES {
  cpu: CPU;
  ppu: PPU;
  bus: Bus;
  charactorROM: ROM;
  programROM: ROM;
  ram: RAM;
  frame: () => void;

  constructor() {
    this.frame = this.frame.bind(this);
  }

  ppuRead(addr: Word) {
    if (addr < 0x2000) {
      return this.charactorROM.read(addr);
    }
    // log.debug(`ppu:read addr = ${addr}`, `size = ${size}`, data);
    // this.emitter.emit('ppu:read-response', data);
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

  setup() {
    return fetch('./static/roms/hello.nes')
      .then((res) => res.arrayBuffer())
      .then((nes: ArrayBuffer) => {
        const { charactorROM, programROM } = parse(nes);
        this.ppu = new PPU(this.bus);
        this.ram = new RAM(2048);
        this.charactorROM = new ROM(charactorROM);
        this.programROM = new ROM(programROM);
        this.bus = new Bus(this.ram, this.programROM, this.charactorROM);
        this.cpu = new CPU(this.bus);
        this.cpu.reset();
      })
  }

  frame() {
    console.time('loop') // eslint-disable-line no-console
    while (!this.ppu.exec(this.cpu.exec() * 3)) {
      // TODO
    }
    console.timeEnd('loop'); // eslint-disable-line no-console
    requestAnimationFrame(this.frame);
  }

  start() {
    requestAnimationFrame(this.frame);
  }
}
