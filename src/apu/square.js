import Source from './audio';
import { CPU_CLOCK } from '../constants/cpu';

export default class Square {

  constructor() {
    this.reset();
    this.source = new Source();
  }

  reset() {
    this.lengthCounter = 0;
    this.isLangthCounterEnable = false;
  }

  updateLengthCounter() {
    if (this.lengthCounterEnable && this.lengthCounter > 0) {
      this.lengthCounter--;
      if (this.lengthCounter === 0) {
        // this.updateSampleValue();
      }
    }
  }

  clockEnvDecay() {
    if (this.envReset) {
      // Reset envelope:
      this.envReset = false;
      this.envDecayCounter = this.envDecayRate + 1;
      this.envVolume = 0xF;
    } else if ((--this.envDecayCounter) <= 0) {
      // Normal handling:
      this.envDecayCounter = this.envDecayRate + 1;
      if (this.envVolume > 0) {
        this.envVolume--;
      } else {
        this.envVolume = this.envDecayLoopEnable ? 0xF : 0;
      }
    }

    this.masterVolume = this.envDecayDisable ? this.envDecayRate : this.envVolume;
    //this.updateSampleValue();
  }

  // updateSampleValue() {
  //   if (this.isEnabled && this.lengthCounter > 0 && this.dividerForFrequency > 7) {
  //     if (this.sweepMode === 0 && (this.dividerForFrequency + (this.dividerForFrequency >> this.sweepShiftAmount)) > 4095) {
  //       this.sampleValue = 0;
  //     } else {
  //       this.sampleValue = this.masterVolume * this.dutyLookup[(this.dutyMode << 3) + this.squareCounter];
  //     }
  //   } else {
  //     this.sampleValue = 0;
  //   }
  // }

  write(addr, data) {
    if (addr === 0x00) {
      this.envDecayDisable = ((data & 0x10) !== 0);
      this.envDecayRate = data & 0xF;
      this.envDecayLoopEnable = ((data & 0x20) !== 0);
      this.dutyMode = (data >> 6) & 0x3;
      this.lengthCounterEnable = ((data & 0x20) === 0);
      this.masterVolume = this.envDecayDisable ? this.envDecayRate : this.envVolume;
      //this.updateSampledata();
    }
    else if (addr === 0x01) {
      // Sweep:
      this.sweepActive = ((data & 0x80) !== 0);
      this.sweepCounterMax = ((data >> 4) & 7);
      this.sweepMode = (data >> 3) & 1;
      this.sweepShiftAmount = data & 7;
      this.updateSweepPeriod = true;
    }
    else if (addr === 0x02) {
      // Programmable timer:
      this.dividerForFrequency &= 0x700;
      this.dividerForFrequency |= data;
    }
    else if (addr === 0x03) {
      // Programmable timer, length counter
      this.dividerForFrequency &= 0xFF;
      this.dividerForFrequency |= ((data & 0x7) << 8);
      //if (this.isEnabled) {
      // this.lengthCounter = this.papu.getLengthMax(value & 0xF8);
      //}
      //this.envReset = true;
      this.start();
    }
  }

  start() {
    // freq = CPU_CLOCK / ((register + 1) * 32) 
    console.log(this.dividerForFrequency)
    const freq = CPU_CLOCK / (this.dividerForFrequency + 1) * 32;
    console.log(freq)
    this.source.setFrequency(freq);
    this.source.start();
  }

  setEnabled(value) {
    this.isEnabled = value;
    if (!value) {
      this.lengthCounter = 0;
    }
    //this.updateSampleValue();
  }

  getLengthStatus() {
    return ((this.lengthCounter === 0 || !this.isEnabled) ? 0 : 1);
  }
}
// Length counter
// When clocked by the frame counter, the length counter is decremented except when:
// The length counter is 0, or
// The halt flag is set