/* @flow */

import Rom from '../rom';
import type { Word, Byte } from '../types/common';

export default class PpuBus {

  charactorROM: Rom;

  constructor(charactorROM: Rom) {
    this.charactorROM = charactorROM;
  }

  readByPpu(addr: Word): Byte {
    if (addr < 0x2000) {
      return this.charactorROM.read(addr);
    } else {
      // FIXME:
      return 0;
    }
  }
}