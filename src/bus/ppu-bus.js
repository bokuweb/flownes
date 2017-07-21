/* @flow */

import Ram from '../ram';
import type { Word, Byte } from '../types/common';

export default class PpuBus {

  characterRam: Ram;

  constructor(characterRam: Ram) {
    this.characterRam = characterRam;
  }

  readByPpu(addr: Word): Byte {
    return this.characterRam.read(addr);
  }

  writeByPpu(addr: Word, data: Byte) {
    this.characterRam.write(addr, data);
  }
}
