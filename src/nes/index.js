/* @flow */

import { parse } from '../parser';
import EventEmitter from 'events';
import CPU from '../cpu';
import PPU from '../ppu';
import ROM from '../rom';
import RAM from '../ram';
import log from '../helper/log';

import type { Word } from '../types/common';
// export type Dispatch = (event: string, params: Array<any>) => {};

export class NES {
  cpu: CPU;
  ppu: PPU;
  charactorROM: ROM;
  programROM: ROM;
  ram: RAM;
  emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  subscribe(events: Object) {
    Object.keys(events).forEach(name => {
      const handler = events[name];
      this.emitter.on(name, handler.bind(this));
    });
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
  cpuRead([addr, size]: [Word, number]) {
    let data: Uint8Array;
    if (addr < 0x0800) {
      data = this.ram.read(addr, size);
    } else if (addr < 0x2000) {
      // mirror
      data = this.ram.read(addr - 0x0800, size);
    } else if (addr >= 0x8000) {
      // ROM
      data = this.programROM.read(addr - 0x8000, size);
    }
    log.debug(`cpu:read addr = ${addr}`, `size = ${size}`, data);
    this.emitter.emit('cpu:read-response', data);
  }

  cpuWrite([addr, data]: [Word, Uint8Array]) {
    log.debug(`cpu:write addr = ${addr}`, data);
    if (addr < 0x0800) {
      // RAM
      this.ram.write(addr, data);
    } else if (addr < 0x2000) {
      // mirror
      this.ram.write(addr - 0x0800, data);
    } else if (addr < 0x2008) {
      // PPU
      this.ppu.write(addr - 0x2000, data);
    }
  }

  async setup() {
    const nes = await fetch('./static/roms/hello.nes').then((res) => res.arrayBuffer());
    const { charactorROM, programROM } = parse(nes);
    this.ppu = new PPU();
    this.ram = new RAM(2048);
    this.charactorROM = new ROM(charactorROM);
    this.programROM = new ROM(programROM);
    this.subscribe({
      'cpu:read': this.cpuRead.bind(this),
      'cpu:write': this.cpuWrite.bind(this),
    });
    this.cpu = new CPU(this.emitter);
    await this.cpu.reset();
    const cycle = await this.cpu.exec();
    for (let i = 0; i < cycle; i++) {
      this.ppu.exec();
    }
  }
}
