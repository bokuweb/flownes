/* @flow */

import KeyEvents from './key-events';
import type { Byte } from '../types/common';

export default class Keypad {

  onKeyDown: (index: ?number) => void;
  onKeyUp: (index: ?number) => void;
  keyEvents: KeyEvents;
  isSet: boolean;
  index: number;
  keyBuffer: Array<boolean>;
  keyRegistors: Array<boolean>;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.keyEvents = new KeyEvents();
    this.keyEvents.setup(this.onKeyDown, this.onKeyUp);
    this.isSet = false;
    this.index = 0;
    this.keyBuffer = [];
    this.keyRegistors = [];
  }

  onKeyDown(index: ?number) {
    if (typeof index !== 'number') return;
    this.keyBuffer[index] = true;
  }

  onKeyUp(index: ?number) {
    if (typeof index !== 'number') return;
    this.keyBuffer[index] = false;
  }

  write(data: Byte) {
    if (data & 0x01) {
      this.isSet = true;
    } else if (this.isSet && !(data & 0x01)) {
      this.isSet = false;
      this.index = 0;
      this.keyRegistors = [...this.keyBuffer];
    }
  }

  read(): boolean {
    return this.keyRegistors[this.index++];
  }
}