/* @flow */

import type { Byte, Word } from '../types/common';
import RAM from '../ram';
import log from '../helper/log';

// interface Registriors {
//   spriteMemoryAddr: Byte;
//   spriteMemoryData: Byte;
//   scrollOffset: Byte;
//   memoryAddr: Byte;
//   memoryData: Byte;
// }

export default class Ppu {

  //
  // Memory map
  /*
  | addr           |  description               |
  +----------------+----------------------------+
  | 0x0000-0x0FFF  |  Pattern table#0           |
  | 0x1000-0x1FFF  |  Pattern table#1           |
  | 0x2000-0x23BF  |  Name table                |
  | 0x23C0-0x23FF  |  Atribute table            |
  | 0x2400-0x27BF  |  Name table                |
  | 0x27C0-0x27FF  |  Attribute table           |
  | 0x2800-0x2BBF  |  Name table                |
  | 0x2BC0-0x2BFF  |  Attribute table           |
  | 0x2C00-0x2FBF  |  Name Table                |
  | 0x2FC0-0x2FFF  |  Attribute Table           |
  | 0x3000-0x3EFF  |  mirror of 0x2000-0x2EFF   |
  | 0x3F00-0x3F0F  |  background pallete        |
  | 0x3F10-0x3F1F  |  sprite pallete            |
  | 0x3F20-0x3FFF  |  mirror of 0x3F00-0x3F1F   |
  */
  registors: Uint8Array;
  cycleCount: number;
  isValidVramAddr: boolean;
  isLowerVramAddr: boolean;
  vramAddr: Word;
  vram: RAM;

  constructor() {
    this.registors = new Uint8Array(0x08);
    this.cycleCount = 0;
    this.isValidVramAddr = false;
    this.isLowerVramAddr = false;
    this.vramAddr = 0x0000;
    this.vram = new RAM(0x2000);
  }

  // The PPU draws one line at 341 clocks and prepares for the next line.
  // While drawing the BG and sprite at the first 256 clocks,
  // it searches for sprites to be drawn on the next scan line.
  // Get the pattern of the sprite searched with the remaining clock.
  exec() {

  }

  read(addr: Word): Uint8Array {
    log.debug(`Read PPU, addr = ${addr}.`);
    if (addr === 0x0007) {
      const offset = this.registors[0x00] & 0x04 ? 0x20 : 0x01;
      this.vramAddr += offset;      
      return this.vram.read(this.vramAddr);
    }
    throw new Error('PPU read error occured. It is a prohibited PPU address.');
  }

  write(addr: Word, data: Uint8Array): void {
    log.debug(`Write PPU, addr = ${addr}, data = ${data[0]}.`);
    if (addr === 0x0006) {
      return this.writeVramAddr(addr, data[0]);
    }
    if (addr === 0x0007) {
      return this.writeVramData(data);
    }
  }

  writeVramAddr(addr: Word, data: Byte) {
    if (this.isLowerVramAddr) {
      this.vramAddr += data;
      this.isLowerVramAddr = false;
      this.isValidVramAddr = true;
    } else {
      this.vramAddr = data << 8;
      this.isLowerVramAddr = true;
      this.isValidVramAddr = false;
    }
  }

  writeVramData(data: Uint8Array) {
    this.writeVram(this.vramAddr, data)
    const offset = this.registors[0x00] & 0x04 ? 0x20 : 0x01;
    this.vramAddr += offset;
  }

  writeVram(addr: Word, data: Uint8Array) {
    this.vram.write(addr - 0x2000, data);
  }
}
