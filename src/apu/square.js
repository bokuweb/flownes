// import Source from './audio';
import Oscillator from './oscillator';
import { CPU_CLOCK } from '../constants/cpu';
import { counterTable } from '../constants/apu';

export default class Square {

  constructor() {
    this.reset();
    // this.source = new Source();
    this.oscillator = new Oscillator();
    this.sweepUnitCounter = 0;
  }

  reset() {
    this.lengthCounter = 0;
    this.isLengthCounterEnable = false;
  }

  updateSweepAndLengthCounter() {
    if (this.isLengthCounterEnable && this.lengthCounter > 0) {
      this.lengthCounter--;
      if (this.lengthCounter === 0) {
        // this.source.stop();
        this.oscillator.stop();
      }
    }

    this.sweepUnitCounter++;
    if (!(this.sweepUnitCounter % this.sweepUnitDivider)) {
      // INFO: 
      // sweep mode 0 : newFreq = currentFreq - (currentFreq >> N)
      // sweep mode 1 : newFreq = currentFreq + (currentFreq >> N)
      if (this.isSweepEnabled) {
        const sign = this.sweepMode ? 1 : -1;
        this.frequency = this.frequency + ((this.frequency >> this.sweepShiftAmount) * sign);
        if (this.frequency > 4095) {
          this.frequency = 4095;
          this.oscillator.stop();
        } else if (this.frequency < 16) {
          this.frequency = 16;
          this.oscillator.stop();
        }
        this.oscillator.changeFrequency(this.frequency);
      }
    }
  }

  /*
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
    */

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
      // this.envDecayDisable = ((data & 0x10) !== 0);
      // this.envDecayRate = data & 0xF;
      // this.envDecayLoopEnable = ((data & 0x20) !== 0);
      // this.dutyMode = (data >> 6) & 0x3;
      this.isLengthCounterEnable = !(data & 0x20);
      // this.masterVolume = this.envDecayDisable ? this.envDecayRate : this.envVolume;
      //this.updateSampledata();\
      console.log(data.toString(16), "0x00")
    }
    else if (addr === 0x01) {
      // Sweep:
      this.isSweepEnabled = !!(data & 0x80);
      this.sweepUnitDivider = ((data >> 4) & 0x07) + 1;
      this.sweepMode = !!(data & 0x08);
      this.sweepShiftAmount = data & 0x07;
      // this.updateSweepPeriod = true;
      console.log(data.toString(16), "0x01", this.isSweepEnabled, this.sweepUnitDivider, this.sweepMode)
    }
    else if (addr === 0x02) {
      this.dividerForFrequency &= 0x700;
      this.dividerForFrequency |= data;
    }
    else if (addr === 0x03) {
      // Programmable timer, length counter
      this.dividerForFrequency &= 0xFF;
      this.dividerForFrequency |= ((data & 0x7) << 8);
      if (this.isLengthCounterEnable) {
        this.lengthCounter = counterTable(data & 0xF8);
      }
      this.frequency = CPU_CLOCK / ((this.dividerForFrequency + 1) * 32);
      this.sweepUnitCounter = 0;
      this.start();
    }
  }

  start() {
    // this.source.setFrequency(freq);
    // this.source.start();
    this.oscillator.start();
    this.oscillator.setFrequency(this.frequency);
  }

  /*
    setEnabled(value) {
      this.isEnabled = value;
      if (!value) {
        this.lengthCounter = 0;
      }
      //this.updateSampleValue();
    }
    */

  // getLengthStatus() {
  //   return ((this.lengthCounter === 0 || !this.isEnabled) ? 0 : 1);
  // }
}
// Length counter
// When clocked by the frame counter, the length counter is decremented except when:
// The length counter is 0, or
// The halt flag is set