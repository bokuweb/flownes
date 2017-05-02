/* @flow */

import NoiseSource from './noise-source';
import { CPU_CLOCK } from '../constants/cpu';
import { counterTable, globalGain, noiseTimerPeriodTable } from '../constants/apu';

import type { Byte } from '../types/common';

export default class Noise {

  source: NoiseSource;
  isLengthCounterEnable: boolean;
  lengthCounter: number;
  linearCounter: number;
  frequency: number;
  dividerForFrequency: number;

  constructor() {
    this.reset();
    this.source = new NoiseSource();
    this.source.setVolume(this.volume)
  }

  get volume(): number {
    return 0x01;
  }

  reset() {
    this.lengthCounter = 0;
    this.isLengthCounterEnable = false;
  }

  // Length counter
  // When clocked by the frame counter, the length counter is decremented except when:
  // The length counter is 0, or The halt flag is set
  updateCounter() {
    if (this.isLengthCounterEnable && this.lengthCounter > 0) {
      this.lengthCounter--;
      if (this.lengthCounter === 0) {
        this.source.stop();
      }
    }
  }

  write(addr: Byte, data: Byte) {
    if (addr === 0x00) {
      this.isLengthCounterEnable = !(data & 0x80);
      this.linearCounter = data & 0x7F;
      this.source.setVolume(this.volume);
    }
    else if (addr === 0x02) {
      this.isShortPeriod = !!(data & 0x80);
      this.source.setFrequency(CPU_CLOCK / noiseTimerPeriodTable[data & 0xF]);
    }
    else if (addr === 0x03) {
      if (this.isLengthCounterEnable) {
        this.lengthCounter = counterTable[data & 0xF8];
      }
      this.source.setVolume(this.volume);
      this.start();
    }
  }

  start() {
    this.source.start();
  }
}
