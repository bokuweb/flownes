/* @flow */

import type { Byte, Word } from '../types/common';

export default class Rom {

  rom: Array<Byte>;
  
  constructor(data: Uint8Array) {
    this.rom = Array.from(data);
  }

  get size(): number {
    return this.rom.length;
  }

  read(addr: Word): Byte {
    return this.rom[addr];
  }
}
