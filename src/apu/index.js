/* @flow */

import type { Byte, Word } from '../types/common';
import Square from './square';
import { DIVIDE_COUNT_FOR_240HZ } from '../constants/apu';

type SquareWaveRegisters = {
  halt: boolean;
  freq: Word;
  length: Byte;
}

export default class Apu {

  registers: Uint8Array;
  // squareWaveRegisters: SquareWaveRegisters[];
  cycle: number;
  step: number;
  envelopesCounter: number;
  square: Square;
  // lengthCounter: number; use register

  constructor() {
    // APU Registers
    // (0x4000 〜 0x4017)
    this.registers = new Uint8Array(0x18);
    this.cycle = 0;
    this.step = 0;
    this.square = new Square();
  }

  exec(cycle: number) {
    this.cycle += cycle;
    if (this.cycle >= DIVIDE_COUNT_FOR_240HZ) {
      // invoked by 240hz
      this.cycle -= DIVIDE_COUNT_FOR_240HZ;
      // TODO: add 5step sequence
      if (this.step % 2 === 0) {

      } else if (this.step % 2 === 1) {
        this.updateLengthCounter();
      }
      this.step++;
      if (this.step === 4) this.step = 0;
    }
  }

  updateLengthCounter() {
    this.square.updateLengthCounter();
  }

  write(addr: Byte, data: Byte) {
    console.log('apu write', addr, data);
    if (addr <= 0x03) {
      // square wave control register
      this.square.write(addr, data);
    } else if (addr === 0x15) {
      this.registers[addr] = data;
    }
  }

  read(addr: Byte): Byte {
    // TODO: 
    return addr;
  }
}
