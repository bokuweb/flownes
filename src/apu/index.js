/* @flow */

import type { Byte } from '../types/common';
import Square from './square';
import Triangle from './triangle';
import { DIVIDE_COUNT_FOR_240HZ } from '../constants/apu';

export default class Apu {

  registers: Uint8Array;
  cycle: number;
  step: number;
  envelopesCounter: number;
  square: Square[];
  triangle: Triangle;
  sequencerMode: number;
  enableIrq: boolean;

  constructor() {
    // APU Registers
    // (0x4000 〜 0x4017)
    this.registers = new Uint8Array(0x18);
    this.cycle = 0;
    this.step = 0;
    this.square = [new Square(), new Square()];
    this.triangle = new Triangle();
  }

  exec(cycle: number) {
    this.cycle += cycle;
    if (this.cycle >= DIVIDE_COUNT_FOR_240HZ) {
      // invoked by 240hz
      this.cycle -= DIVIDE_COUNT_FOR_240HZ;
      if (this.sequencerMode) {
        this.updateBySequenceMode1();
      } else {
        this.updateBySequenceMode0();
      }
    }
  }

  updateBySequenceMode0() {
    this.updateEnvelope();
    if (this.step % 2 === 1) {
      this.updateSweepAndLengthCounter();
    }
    this.step++;
    if (this.step === 4) {
      if (this.enableIrq) {
        // TODO: assert IRQ
      }
      this.step = 0;
    }
  }

  updateBySequenceMode1() {
    if (this.step % 2 === 0) {
      this.updateSweepAndLengthCounter();
    }
    this.step++;
    if (this.step === 5) {
      this.step = 0;
    } else {
      this.updateEnvelope();
    }
  }

  updateSweepAndLengthCounter() {
    this.square.forEach((s: Square): void => s.updateSweepAndLengthCounter());
    this.triangle.updateCounter();
  }

  updateEnvelope() {
    this.square.forEach((s: Square): void => s.updateEnvelope());
  }

  write(addr: Byte, data: Byte) {
    /* eslint-disable */
    console.log('apu write', addr, data);
    if (addr <= 0x03) {
      // square wave control register
      this.square[0].write(addr, data);
    } else if (addr <= 0x07) {
      // square wave control register
      this.square[1].write(addr - 0x04, data);
    } else if (addr <= 0x07) {
      // square wave control register
      this.square[1].write(addr - 0x04, data);
    } else if (addr <= 0x0B) {
      this.triangle.write(addr - 0x08, data);
    } else if (addr === 0x17) {
      this.sequencerMode = data & 0x80 ? 1 : 0;
      this.registers[addr] = data;
      this.enableIrq = !!(data & 0x40);
    }
  }

  read(addr: Byte): Byte {
    // TODO: 
    return addr;
  }
}
