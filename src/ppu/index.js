/* @flow */

import type { Byte, Word } from '../types/common';

import RAM from '../ram';
import PpuBus from '../bus/ppu-bus';
import Interrupts from '../interrupts';

const SPRITES_NUMBER = 0x100;

export type Sprite = $ReadOnlyArray<$ReadOnlyArray<number>>;

export type Palette = $ReadOnlyArray<Byte>;

export type SpriteType = 'background' | 'sprite'

export interface SpriteWithAttribute {
  sprite: Sprite;
  x: Byte;
  y: Byte;
  attr: Byte; // TODO
  spriteId: number;
}

export interface Background {
  sprite: Sprite;
  paletteId: Byte;
  scrollX: Byte;
  scrollY: Byte;
}

export interface RenderingData {
  palette: Palette;
  background: ?$ReadOnlyArray<Background>;
  sprites: ?$ReadOnlyArray<SpriteWithAttribute>;
}
export interface Config {
  isHorizontalMirror: boolean;
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
  | 0x23C0-0x23FF  |  Attribute table            |
  | 0x2400-0x27BF  |  Name table                |
  | 0x27C0-0x27FF  |  Attribute table           |
  | 0x2800-0x2BBF  |  Name table                |
  | 0x2BC0-0x2BFF  |  Attribute table           |
  | 0x2C00-0x2FBF  |  Name Table                |
  | 0x2FC0-0x2FFF  |  Attribute Table           |
  | 0x3000-0x3EFF  |  mirror of 0x2000-0x2EFF   |
  | 0x3F00-0x3F0F  |  background Palette        |
  | 0x3F10-0x3F1F  |  sprite Palette            |
  | 0x3F20-0x3FFF  |  mirror of 0x3F00-0x3F1F   |
  */

  /*
    Control Register1 0x2000

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
    Control Register2 0x2001

  | bit  | description                                 |
  +------+---------------------------------------------+
  |  7-5 | Background color  0x00: Black               |
  |      |                   0x01: Green               |
  |      |                   0x02: Blue                |
  |      |                   0x04: Red                 |
  |  4   | Enable sprite                               |
  |  3   | Enable background                           |
  |  2   | Sprite mask       render left end           |
  |  1   | Background mask   render left end           |
  |  0   | Display type      0: color, 1: mono         |
  */
  registers: Uint8Array;
  cycle: number;
  line: number;
  isValidVramAddr: boolean;
  isLowerVramAddr: boolean;
  spriteRamAddr: Byte;
  vramAddr: Word;
  vram: RAM;
  spriteRam: RAM;
  bus: PpuBus;
  background: Array<Background>;
  sprites: Array<SpriteWithAttribute>;
  palette: Palette;
  interrupts: Interrupts;
  isHorizontalScroll: boolean;
  scrollX: Byte;
  scrollY: Byte;
  config: Config;

  constructor(bus: PpuBus, interrupts: Interrupts, config: Config) {
    this.registers = new Uint8Array(0x08);
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
    this.interrupts = interrupts;
    this.config = config;
    this.scrollX = 0;
    this.scrollY = 0;

    // debug
    this.dump = new Array(32);
  }

  get vramOffset(): Byte {
    return (this.registers[0x00] & 0x04) ? 32 : 1;
  }

  get nameTableId(): Byte {
    return this.registers[0x00] & 0x03;
  }

  getPalette(): Palette {
    const palette = [];
    for (let i = 0; i < 0x20; i = (i + 1) | 0) {
      const isMirror = (i === 0x10) || (i === 0x14) || (i === 0x18) || (i === 0x1c);
      //NOTE: 0x3f10, 0x3f14, 0x3f18, 0x3f1c is mirror of 0x3f00, 0x3f04, 0x3f08, 0x3f0c 
      const addr = isMirror ? (0x1F00 + (i - 0x10)) : (i + 0x1F00);
      palette.push(this.vram.read(addr));
    }
    return palette;
  }

  clearSpriteHit() {
    this.registers[0x02] &= 0xBF;
  }

  setSpriteHit() {
    this.registers[0x02] |= 0x40;
  }

  hasSpriteHit(): boolean {
    return this.sprites.some((sprite: SpriteWithAttribute): boolean => (
      sprite.y === this.line && sprite.spriteId === 0)
    );
  }

  isBackgroundEnable(): boolean {
    return !!(this.registers[0x01] & 0x08);
  }

  isSpriteEnable(): boolean {
    return !!(this.registers[0x01] & 0x04);
  }

  setVblank() {
    this.registers[0x02] |= 0x80;
  }

  clearVblank() {
    this.registers[0x02] &= 0x7F;
  }

  // The PPU draws one line at 341 clocks and prepares for the next line.
  // While drawing the BG and sprite at the first 256 clocks,
  // it searches for sprites to be drawn on the next scan line.
  // Get the pattern of the sprite searched with the remaining clock.
  exec(cycle: number): RenderingData | null {
    this.cycle += cycle;
    if (this.line === 0) {
      // console.log(this.background, 'bg')
      this.background = [];
      this.clearSpriteHit();
      this.buildSprites();
    }
    if (this.cycle >= 341) {
      this.cycle -= 341;
      this.line++;
      if (this.line < 240) {
        if (this.hasSpriteHit()) {
          this.setSpriteHit();
        }
        this.buildBackground();
      }
      if (this.line === 240) {
        this.setVblank();
        if (this.registers[0] & 0x80) {
          this.interrupts.assertNmi();
        }
      }

      if (this.line === 261) {
        this.clearVblank();
        this.line = 0;
        this.interrupts.deassertNmi();
        // if (this.isBackgroundEnable()) debugger
        // console.log(this.background, 'bg')

        // For debug
        // for (let i = 0; i < 32; i++) {
        //   if (this.dump[i]) {
        //     console.log(this.dump[i].join(' '));
        //   }
        // }

        return {
          background: this.isBackgroundEnable() ? this.background : null,
          sprites: this.isSpriteEnable() ? this.sprites : null,
          palette: this.getPalette(),
        };
      }
    }
    return null;
  }

  buildBackground() {

    if (this.line % 8) return;
    const tileY = ~~(this.line / 8);
    // TODO: See. ines header mirror flag..
    // background of a line.
    // Build viewport + 1 tile for background scroll.
    for (let x = 0; x < 32 + 1; x = (x + 1) | 0) {
      /*
        Name table id and address
        +------------+------------+
        |            |            | 
        |  0(0x2000) |  1(0x2400) | 
        |            |            |
        +------------+------------+ 
        |            |            | 
        |  2(0x2800) |  3(0x2C00) | 
        |            |            |
        +------------+------------+       
      */
      const scrollTileX = ~~(this.scrollX / 8);
      const tileX = x + scrollTileX;
      // TODO: Add vertical scroll logic
      const nameTableId = ~~(tileX / 32) + this.nameTableId;
      const tileNumber = tileY * 32 + (tileX % 32);
      // TODO: Fix offset
      const blockId = (~~((tileX % 32) / 2) + ~~(tileY / 2));
      let spriteAddr = tileNumber + (nameTableId * 0x400);
      let attrAddr = ~~(blockId / 4) + 0x03C0 + (nameTableId * 0x400);

      if (this.config.isHorizontalMirror) {
        if (spriteAddr >= 0x0400 && spriteAddr < 0x0800 || spriteAddr >= 0x0C00) {
          spriteAddr -= 0x400;
        }
        if (attrAddr >= 0x0400 && attrAddr < 0x0800 || attrAddr >= 0x0C00) {
          attrAddr -= 0x400;
        }
      }
      const spriteId = this.vram.read(spriteAddr);
      // console.log(spriteAddr.toString(16), spriteId)

      // debug
      if (!this.dump[tileY]) this.dump[tileY] = new Array(32);
      this.dump[tileY][tileX] = spriteId;

      const attr = this.vram.read(attrAddr);
      const paletteId = (attr >> (blockId % 4 * 2)) & 0x03;
      const offset = (this.registers[0] & 0x10) ? 0x1000 : 0x0000;
      const sprite = this.buildSprite(spriteId, offset);
      this.background.push({
        sprite,
        paletteId,
        scrollX: this.scrollX,
        scrollY: this.scrollY,
      });
    }
  }

  buildSprites() {
    for (let i = 0; i < SPRITES_NUMBER; i = (i + 4) | 0) {
      const y = this.spriteRam.read(i);
      const spriteId = this.spriteRam.read(i + 1);
      const attr = this.spriteRam.read(i + 2);
      const x = this.spriteRam.read(i + 3);
      const offset = (this.registers[0] & 0x08) ? 0x1000 : 0x0000;
      const sprite = this.buildSprite(spriteId, offset);
      this.sprites[i / 4] = { sprite, x, y, attr, spriteId };
    }
  }

  buildSprite(spriteId: number, offset: Word): Sprite {
    const sprite = new Array(8).fill(0).map((): Array<number> => [0, 0, 0, 0, 0, 0, 0, 0]);
    for (let i = 0; i < 16; i = (i + 1) | 0) {
      for (let j = 0; j < 8; j = (j + 1) | 0) {
        const addr = spriteId * 16 + i + offset;
        const rom = this.readCharacterROM(addr);
        if (rom & (0x80 >> j)) {
          sprite[i % 8][j] += 0x01 << (i / 8);
        }
      }
    }
    return sprite;
  }

  readCharacterROM(addr: Word): Byte {
    return this.bus.readByPpu(addr);
  }

  read(addr: Word): Byte {
    /*
    | bit  | description                                 |
    +------+---------------------------------------------+
    | 7    | 1: VBlank clear by reading this register    |
    | 6    | 1: sprite hit                               |
    | 5    | 0: less than 8, 1: 9 or more                |
    | 4-0  | invalid                                     |                                 
    |      | bit4 VRAM write flag [0: success, 1: fail]  |
    */
    if (addr === 0x0002) {
      this.isHorizontalScroll = true;
      const data = this.registers[0x02];
      this.clearVblank();
      return data;
    }
    if (addr === 0x0007) {
      this.vramAddr += this.vramOffset;
      return this.vram.read(this.vramAddr);
    }
    throw new Error('PPU error occurred. It is a prohibited PPU address.');
  }

  write(addr: Word, data: Byte): void {
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
    // console.log('ppu reg', addr, data.toString(16))
    this.registers[addr] = data;
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
    // if (this.vramAddr >= 0x3F00 && this.vramAddr < 0x3f20 && data === 1) {
    //   debugger;
    //   this.vramAddr += this.vramOffset;
    //   return;
    // }
    let addr = this.vramAddr - 0x2000;
    const isMirror = (addr === 0x1f10) || (addr === 0x1f14) || (addr === 0x1f18) || (addr === 0x1f1c);
    //NOTE: 0x3f10, 0x3f14, 0x3f18, 0x3f1c is mirror of 0x3f00, 0x3f04, 0x3f08, 0x3f0c 
    addr = isMirror ? (addr - 0x10) : addr;
    this.writeVram(addr, data);
    this.vramAddr += this.vramOffset;
  }

  writeVram(addr: Word, data: Byte) {
    this.vram.write(addr, data);
  }

  transferSprite(addr: Byte, data: Byte) {
    this.spriteRam.write(addr, data);
  }
}

