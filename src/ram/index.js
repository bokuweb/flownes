/* @flow */

import type { Byte, Word } from '../types/common';

export default class RAM {

  ram: Array<Byte>;

  constructor(size: number) {
    this.ram = new Array(size);
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
