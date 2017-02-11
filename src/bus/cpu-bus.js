/* @flow */

import Rom from '../rom';
import Ram from '../ram';
import Ppu from '../ppu';

import type { Word, Byte } from '../types/common';

export default class CpuBus {

  ram: Ram;
  ppu: Ppu;
  charactorROM: Rom;
  programROM: Rom;

  constructor(ram: Ram, programROM: Rom, charactorROM: Rom, ppu: Ppu) {
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
    } else if (addr < 0x4000) {
      // mirror
      return this.ppu.read((addr - 0x2000) % 8);
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