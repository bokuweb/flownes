/* @flow */

import type { Byte, Word } from '../types/common';

export type PaletteRam = Uint8Array;

export default class Palette {

  ram: PaletteRam;

  constructor() {
    this.ram = new Uint8Array(0x20);
  }

  isSpriteMirror(addr: Byte): boolean {
    return (addr === 0x10) || (addr === 0x14) || (addr === 0x18) || (addr === 0x1c);
  }

  isBackgroundMirror(addr: Byte): boolean {
    return (addr === 0x04) || (addr === 0x08) || (addr === 0x0c);
  }

  read(): PaletteRam {
    return this.ram.map((v: Byte, i: number): Byte => {
      if (this.isSpriteMirror(i)) return this.ram[i - 0x10];
      if (this.isBackgroundMirror(i)) return this.ram[0x00];
      return v;
    });
  }

  getPaletteAddr(addr: Byte): Byte {
    const mirrorDowned = ((addr & 0xFF) % 0x20);
    //NOTE: 0x3f10, 0x3f14, 0x3f18, 0x3f1c is mirror of 0x3f00, 0x3f04, 0x3f08, 0x3f0c 
    return this.isSpriteMirror(mirrorDowned) ? mirrorDowned - 0x10 : mirrorDowned;
  }

  write(addr: Word, data: Byte) {
    this.ram[this.getPaletteAddr(addr)] = data;
  }
}

