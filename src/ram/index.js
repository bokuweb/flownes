/* @flow */

import type { Byte, Word } from '../types/common';

// const range = (n: number): number[] => Array.from(Array(n).keys());

export default class RAM {

  ram: Uint8Array;

  constructor(size: Byte) {
    this.ram = new Array(size);
    this.ram.fill(0);
  }

  reset(): void {
    this.ram.fill(0);
  }

  read(addr: Word, size: number = 1): Uint8Array {
    return this.ram[addr];
  }

  write(addr: Word, data: number): void {
    this.ram[addr] = data;
  }
}
