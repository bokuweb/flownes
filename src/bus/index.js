/* @flow */

import ROM from '../rom';
import RAM from '../ram';
import PPU from '../ppu';

import type { Word, Byte } from '../types/common';

export default class Bus {

  ram: RAM;
  bus: Bus;
  ppu: PPU;
  charactorROM: ROM;
  programROM: ROM;

  constructor(ram: RAM, programROM: ROM, charactorROM: ROM, ppu: PPU) {
    this.ram = ram;
    this.programROM = programROM;
    this.charactorROM = charactorROM;
    this.ppu = ppu;
  }

  readByCpu(addr: Word): Byte {
    if (addr < 0x0800) {
      return this.ram.read(addr);
    } else if (addr < 0x2000) {
      // mirror
      return this.ram.read(addr - 0x0800);
    } else if (addr >= 0x8000) {
      // ROM
      return this.programROM.read(addr - 0x8000);
    } else {
      // FIXME:
      return 0;
    }
  }

  writeByCpu(addr: Word, data: Byte) {
    // log.debug(`cpu:write addr = ${addr}`, data);
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

  readByPpu(addr: Word): Byte {
    if (addr < 0x2000) {
      return this.charactorROM.read(addr);
    } else {
      // FIXME:
      return 0;
    }
  }
}