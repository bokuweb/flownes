/* @flow */

import type { Byte, Word } from '../types/common';

export default class RAM {

  ram: Uint8Array;

  constructor(size: number) {
    this.ram = new Uint8Array(size);
    this.ram.fill(0);
  }

  reset() {
    this.ram.fill(0);
  }

  read(addr: Word): Byte {
    return this.ram[addr];
  }

  write(addr: Word, data: number) {
    this.ram[addr] = data;
  }
}
