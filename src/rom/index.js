/* @flow */

import type { Byte, Word } from '../types/common';

const range = (n: number): number[] => Array.from(Array(n).keys());

export default class Rom {

  rom: Uint8Array;

  constructor(data: Uint8Array) {
    this.rom = data;
  }

  read(addr: Word, size: number = 1): Array<Byte> {
    return range(size).map(i => this.rom[addr + i]);
  }
}
