/* @flow */

import KeyEvents from './key-events';
import type { Byte } from '../types/common';

export default class Keypad {
  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.keyEvents = new KeyEvents();
    this.keyEvents.setup(this.onKeyDown, this.onKeyUp);
    this.isSet = false;
    // this.canRead = false;
    this.index = 0;
    this.keyBuffer = new Array(8);
    this.keyRegistors = new Array(8);
  }

  onKeyDown(index: number) {
    this.keyBuffer[index] = true;
  }

  onKeyUp(index: number) {
    this.keyBuffer[index] = false;
  }  

  write(data: Byte) {
    if (data & 0x01) {
      this.isSet = true;
      // this.canRead = false;
    } else if (this.isSet && !(data & 0x01)) {
      // this.canRead = true;
      this.isSet = false;
      this.index = 0;
      this.keyRegistors = [...this.keyBuffer];
    }
  }

  read(): Byte {
    return this.keyRegistors[this.index++];
  }
}