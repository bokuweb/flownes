/* @flow */

import type { Byte, Word } from '../types/common';

import RAM from '../ram';
import Bus from '../bus';
// import log from '../helper/log';

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

  /*
    Control Registor1 0x2000

  | bit  | descripti   on                              |
  +------+---------------------------------------------+
  |  7   | Assert NMI when VBlank 0: disable, 1:enable |
  |  6   | PPU master/slave, always 1                  |
  |  5   | Sprite size 0: 8x8, 1: 8x16                 |
  |  4   | Bg pattern table 0:0x0000, 1:0x1000         |
  |  3   | sprite pattern table 0:0x0000, 1:0x1000     |
  |  2   | PPU memory increment 0: +=1, 1:+=32         |
  |  1-0 | Name table 0x00: 0x2000                     |
  |      |            0x01: 0x2400                     |
  |      |            0x02: 0x2800                     |
  |      |            0x03: 0x2C00                     |
  */

  /*
    Control Registor2 0x2001

  | bit  | descripti   on                              |
  +------+---------------------------------------------+
  |  7-5 | Background color  0x00: Black               |
  |      |                   0x01: Geen                |
  |      |                   0x02: Blue                |
  |      |                   0x04: Red                 |
  |  4   | Enable sprite                               |
  |  3   | Enable background                           |
  |  2   | Sprite mask       render left end           |
  |  1   | Background mask   render left end           |
  |  0   | Display type      0: color, 1: mono         |
  */
  registors: Uint8Array;
  cycleCount: number;
  lineCount: number;
  isValidVramAddr: boolean;
  isLowerVramAddr: boolean;
  vramAddr: Word;
  vram: RAM;
  bus: Bus;

  constructor(bus: Bus) {
    this.registors = new Uint8Array(0x08);
    this.cycleCount = 0;
    this.lineCount = 0;
    this.isValidVramAddr = false;
    this.isLowerVramAddr = false;
    this.vramAddr = 0x0000;
    this.vram = new RAM(0x2000);
    this.bus = bus;
  }

  // The PPU draws one line at 341 clocks and prepares for the next line.
  // While drawing the BG and sprite at the first 256 clocks,
  // it searches for sprites to be drawn on the next scan line.
  // Get the pattern of the sprite searched with the remaining clock.
  exec(cycle: number) {
    this.cycleCount += cycle;

    // const isScreenEnable = !!(this.registors[0x01] & 0x08);
    // const isSpriteEnable = !!(this.registors[0x01] & 0x10);
    if (this.cycleCount >= 341) {
      this.cycleCount -= 341;
      this.lineCount++;
      //if(this.lineCount < 8) {
      //} else if (this.lineCount < 240) {
      //} else if (this.lineCount === 240) {
      //}
      if (this.lineCount === 240) {
        // const rom = this.readCharactorROM(0x0000, 0x2000);
        this.lineCount = 0;
        return true;
      }
    }
  }

  readCharactorROM(addr: Word, size: "Byte" | "Word"): Array<Byte> {
    let data: Array<Byte> = [];
    this.bus.ppuRead(addr, size);
    return data;
  }

  read(addr: Word): Byte {
    //log.debug(`Read PPU, addr = ${addr}.`);
    if (addr === 0x0007) {
      const offset = this.registors[0x00] & 0x04 ? 0x20 : 0x01;
      this.vramAddr += offset;
      return this.vram.read(this.vramAddr);
    }
    throw new Error('PPU read error occured. It is a prohibited PPU address.');
  }

  write(addr: Word, data: Byte): void {
    // log.debug(`Write PPU, addr = ${addr}, data = ${data[0]}.`);
    if (addr === 0x0006) {
      return this.writeVramAddr(addr, data);
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

  writeVramData(data: Byte) {
    this.writeVram(this.vramAddr, data)
    const offset = this.registors[0x00] & 0x04 ? 32 : 1;
    this.vramAddr += offset;
  }

  writeVram(addr: Word, data: Byte) {
    this.vram.write(addr - 0x2000, data);
  }
}
