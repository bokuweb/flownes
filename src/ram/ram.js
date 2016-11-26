/* @flow */

import type { Byte, Word } from '../types/common';

export class Ram {

  memory: Uint8Array;

  constructor(size: Byte) {
    this.memory = new Uint8Array(size);
  }

  reset(): void {
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = 0x00;
    }
  }

  read(addr: Word): Byte {
    return this.memory[addr];
  }

  write(addr: Word, data: Byte): void {
    this.memory[addr] = data;
  }
}
