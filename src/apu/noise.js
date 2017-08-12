/* @flow */

import NoiseSource from './noise-source';
import { CPU_CLOCK } from '../constants/cpu';
import { counterTable, globalGain, noiseTimerPeriodTable } from '../constants/apu';

import type { Byte } from '../types/common';

export default class Noise {

  source: NoiseSource;
  isLengthCounterEnable: boolean;
  lengthCounter: number;
  frequency: number;
  dividerForFrequency: number;
  envelopeLoopEnable: boolean;
  envelopeGeneratorCounter: number;
  envelopeRate: number;
  envelopeVolume: number;
  envelopeEnable: boolean;

  constructor() {
    this.envelopeGeneratorCounter = 0;
    this.envelopeRate = 0x0F;
    this.envelopeVolume = 0x0F;
    this.envelopeEnable = false;
    this.reset();
    this.source = new NoiseSource();
    this.source.setVolume(this.volume);
  }

  get volume(): number {
    const vol = this.envelopeEnable ? this.envelopeVolume : this.envelopeRate;
    return vol / (0x0F / globalGain);
  }

  reset() {
    this.lengthCounter = 0;
    this.isLengthCounterEnable = false;
  }

  updateEnvelope() {
    if ((--this.envelopeGeneratorCounter) <= 0) {
      this.envelopeGeneratorCounter = this.envelopeRate;
      if (this.envelopeVolume > 0) {
        this.envelopeVolume--;
      } else {
        this.envelopeVolume = 0x0F;
      }
    }
    this.source.setVolume(this.volume);
  }

  // Length counter
  // When clocked by the frame counter, the length counter is decremented except when:
  // The length counter is 0, or The halt flag is set
  updateCounter() {
    // if (this.isLengthCounterEnable) {
    //   if (this.lengthCounter > 0) {
    //     this.lengthCounter--;
    //   } else {
    //     this.source.setVolume(0);
    //   }
    // }
  }

  write(addr: Byte, data: Byte) {
    if (addr === 0x00) {
      this.envelopeEnable = (data & 0x10) === 0;
      this.envelopeRate = data & 0xF;
      this.isLengthCounterEnable = !(data & 0x20);
      this.source.setVolume(this.volume);
    } else if (addr === 0x02) {
      // this.isShortPeriod = !!(data & 0x80);
      this.source.setFrequency(CPU_CLOCK / noiseTimerPeriodTable[data & 0xF]);
    } else if (addr === 0x03) {
      if (this.isLengthCounterEnable) {
        this.lengthCounter = counterTable[data & 0xF8];
      }
      this.envelopeGeneratorCounter = this.envelopeRate;
      this.envelopeVolume = 0x0F;
      this.source.setVolume(this.volume);
    }
  }

  close() {
    this.source.close();
  }
}
