/* @flow */

import type { Byte, Word } from '../types/common';

const range = (n: number): number[] => Array.from(Array(n).keys());

export default class RAM {

  ram: Uint8Array;

  constructor(size: Byte) {
    this.ram = new Uint8Array(size);
    this.ram.fill(0);
  }

  reset(): void {
    this.ram.fill(0);
  }

  read(addr: Word, size: number = 1): Uint8Array {
    return new Uint8Array(range(size).map(i => this.ram[addr + i]));
  }

  write(addr: Word, data: Uint8Array): void {
    for (let i = 0; i < data.length; i++) {
      this.ram[addr + i] = data[i];
    }
  }
}
