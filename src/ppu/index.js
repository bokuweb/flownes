/* @flow */

import type { Byte, Word } from '../types/common';

import RAM from '../ram';
import PpuBus from '../bus/ppu-bus';
import Interrupts from '../interrupts';
// import log from '../helper/log';

// interface Registriors {
//   spriteMemoryAddr: Byte;
//   spriteMemoryData: Byte;
//   scrollOffset: Byte;
//   memoryAddr: Byte;
//   memoryData: Byte;
//   status: Byte;
// }

const SPRITES_NUMBER = 0x100;

export type Sprite = Array<Array<number>>;

export type Pallete = Array<Byte>;

export type SpriteType = 'background' | 'sprite'

export interface SpriteWithAttribute {
  sprite: Sprite;
  x: Byte;
  y: Byte;
  attr: Byte; // TODO
}

export interface Background {
  sprite: Sprite;
  palleteId: Byte;
}

export interface RenderingData {
  isReady: boolean;
  pallete: Pallete;
  background: Array<Background>;
  sprites: Array<SpriteWithAttribute>
}

export default class Ppu {

  // PPU power up state
  // see. https://wiki.nesdev.com/w/index.php/PPU_power_up_state
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

  | bit  | description                                 |
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

  | bit  | description                                 |
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
  cycle: number;
  line: number;
  isValidVramAddr: boolean;
  isLowerVramAddr: boolean;
  spriteRamAddr: Byte;
  vramAddr: Word;
  vram: RAM;
  spriteRam: RAM;
  bus: PpuBus;
  display: Array<Array<number>>;
  background: Array<Background>;
  sprites: Array<SpriteWithAttribute>;
  pallete: Pallete;
  interrupts: Interrupts;
  isHorizontalScroll: boolean;
  scrollX: Byte;
  scrollY: Byte;

  constructor(bus: PpuBus, interrupts: Interrupts) {
    this.registors = new Uint8Array(0x08);
    this.cycle = 0;
    this.line = 0;
    this.isValidVramAddr = false;
    this.isLowerVramAddr = false;
    this.isHorizontalScroll = true;
    this.vramAddr = 0x0000;
    this.vram = new RAM(0x2000);
    this.spriteRam = new RAM(0x100);
    this.background = [];
    this.sprites = [];
    this.bus = bus;
    this.pallete = [];
    this.interrupts = interrupts;
  }

  getPallete(): Pallete {
    this.pallete = [];
    for (let i = 0; i < 0x20; i++) {
      this.pallete.push(this.vram.read(0x1F00 + i));
    }
    return this.pallete;
  }

  // The PPU draws one line at 341 clocks and prepares for the next line.
  // While drawing the BG and sprite at the first 256 clocks,
  // it searches for sprites to be drawn on the next scan line.
  // Get the pattern of the sprite searched with the remaining clock.
  exec(cycle: number): RenderingData {
    this.cycle += cycle;
    // const isScreenEnable = !!(this.registors[0x01] & 0x08);
    // const isSpriteEnable = !!(this.registors[0x01] & 0x10);
    if (this.line === 0) this.background = [];
    if (this.cycle >= 341) {
      this.cycle -= 341;
      this.line++;
      if (this.line < 240) {
        this.buildBackground();
      }
      if (this.line === 240) {
        // build sprite
        this.buildSprites();
        this.registors[0x02] |= 0x80;
        if (this.registors[0] & 0x80) {
          this.interrupts.assertNmi();
        }
      }

      if (this.line === 261) {
        this.registors[0x02] &= 0x7F;
        this.line = 0;
        this.interrupts.deassertNmi();
        // debug
        // const test = [];
        // for(let i = 0; i < 960; i++) {
        //   test.push(this.vram.read(i));
        // }
        // console.log(test);
        return {
          isReady: true,
          background: this.background,
          sprites: this.sprites,
          pallete: this.getPallete(),
        };
      }
    }
    return {
      isReady: false,
      sprites: [],
      background: [],
      pallete: [],
    };
  }

  buildBackground() {
    if (this.line % 8) return;
    const tileY = ~~(this.line / 8);
    // TODO: See. ines header mrror flag..
    // background of a line.
    for (let x = 0; x < 32; x++) {
      const tileNumber = tileY * 32 + x;
      const spriteId = this.vram.read(tileNumber);
      // TODO: Fix offset
      const blockId = (~~(x / 2) + ~~(tileY / 2));
      const attrAddr = ~~(blockId / 4);
      const attr = this.vram.read(attrAddr + 0x03C0);
      const palleteId = (attr >> (blockId % 4 * 2)) & 0x03;
      const offset = (this.registors[0] & 0x10) ? 0x1000 : 0x0000;
      const sprite = this.buildSprite(spriteId, offset);
      this.background.push({
        sprite, palleteId,
      });
    }
  }

  buildSprites() {
    for (let i = 0; i < SPRITES_NUMBER; i += 4) {
      const y = this.spriteRam.read(i);
      const spriteId = this.spriteRam.read(i + 1);
      const attr = this.spriteRam.read(i + 2);
      const x = this.spriteRam.read(i + 3);
      const offset = (this.registors[0] & 0x08) ? 0x1000 : 0x0000;
      const sprite = this.buildSprite(spriteId, offset);
      this.sprites[i / 4] = {
        sprite, x, y, attr,
      }
    }
  }

  buildSprite(spriteId: number, offset: Word): Sprite {
    const sprite = new Array(8).fill(0).map((): Array<number> => new Array(8).fill(0));
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 8; j++) {
        const addr = spriteId * 16 + i + offset;
        const rom = this.readCharactorROM(addr);
        if (rom & (0x80 >> j)) {
          sprite[i % 8][j] += 0x01 << (i / 8);
        }
      }
    }
    return sprite;
  }

  readCharactorROM(addr: Word): Byte {
    return this.bus.readByPpu(addr);
  }

  read(addr: Word): Byte {
    /*
    | bit  | description                                 |
    +------+---------------------------------------------+
    | 7    | 1: VBlank clear by reading this registor    |
    | 6    | 1: sprite hit                               |
    | 5    | 0: less than 8, 1: 9 or more                |
    | 4-0  | invalid                                     |                                 
    |      | bit4 VRAM write flag [0: success, 1: fail]  |
    */
    if (addr === 0x0002) {
      // TODO: Reset clear 0x2005 order
      const data = this.registors[0x02];
      this.registors[0x02] = this.registors[0x02] & 0x7F;
      return data;
    }
    if (addr === 0x0007) {
      const offset = this.registors[0x00] & 0x04 ? 0x20 : 0x01;
      this.vramAddr += offset;
      // TODO: See ines header mirror flag, and implement mapper.
      //       it is a temporary code.
      // if (this.vramAddr >= 0x0400) {
      //   this.vramAddr -= 0x400;
      // }
      return this.vram.read(this.vramAddr);
    }
    throw new Error('PPU read error occured. It is a prohibited PPU address.');
  }

  write(addr: Word, data: Byte): void {
    // log.debug(`Write PPU, addr = ${addr}, data = ${data.toString(16)}.`);
    if (addr === 0x0003) {
      return this.writeSpriteRamAddr(data);
    }
    if (addr === 0x0004) {
      return this.writeSpriteRamData(data);
    }
    if (addr === 0x0005) {
      return this.writeScrollData(data);
    }
    if (addr === 0x0006) {
      return this.writeVramAddr(data);
    }
    if (addr === 0x0007) {
      return this.writeVramData(data);
    }
    this.registors[addr] = data;
  }

  writeSpriteRamAddr(data: Byte) {
    this.spriteRamAddr = data;
  }

  writeSpriteRamData(data: Byte) {
    this.spriteRam.write(this.spriteRamAddr, data);
    this.spriteRamAddr += 1;
  }

  writeScrollData(data: Byte) {
    if (this.isHorizontalScroll) {
      this.isHorizontalScroll = false;
      this.scrollX = data & 0xFF;
    } else {
      this.scrollY = data & 0xFF;
      this.isHorizontalScroll = true;
    }
  }

  writeVramAddr(data: Byte) {
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
    this.writeVram(this.vramAddr - 0x2000, data);
    const offset = this.registors[0x00] & 0x04 ? 32 : 1;
    this.vramAddr += offset;
  }

  writeVram(addr: Word, data: Byte) {
    this.vram.write(addr, data);
  }

  transferSprite(addr: Byte, data: Byte) {
    this.spriteRam.write(addr, data);
  }
}

