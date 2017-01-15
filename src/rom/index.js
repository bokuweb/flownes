/* @flow */

import type { Word } from '../types/common';

export default class Rom {

  rom: Uint8Array;

  constructor(data: Uint8Array) {
    this.rom = Array.from(data);
  }

  read(addr: Word, size: number = 1): Uint8Array {
    return this.rom[addr];
  }
}
