/* @flow */

import { dict } from '../cpu/opcode';

export default class Debugger {

  constructor() {
    window.__disassembled = () => this.displayDisaasembled();
  }

  setup(rom: Uint8Array) {
    const debugInfo = [];
    let pc = 0;
    let opcodeIndex = 0;
    while (typeof rom[pc] !== 'undefined') {
      const op = [];
      const opcodeAddr = (0x8000 + pc).toString(16);
      const opcode = dict[rom[pc].toString(16).toUpperCase()];
      if (!opcode) {
        debugInfo[opcodeIndex] = [opcodeAddr];
        pc++;
        opcodeIndex++;
        continue;
      }
      op.push(opcode.fullName);
      pc++;
      switch (opcode.mode) {
        case 'accumulator':
        case 'implied': {
          debugInfo[opcodeIndex] = [opcodeAddr, ...op];
          opcodeIndex++;
          continue;
        }
      }
      op.push(rom[pc]);
      pc++;
      switch (opcode.mode) {
        case 'immediate':
        case 'relative':
        case 'zeroPage':
        case 'zeroPageX':
        case 'zeroPageY':
        case 'preIndexedIndirect':
        case 'postIndexedIndirect': {
          debugInfo[opcodeIndex] = [opcodeAddr, ...op];
          opcodeIndex++;
          continue;
        }
      }
      op.push(rom[pc]);
      debugInfo[opcodeIndex] = [opcodeAddr, ...op];
      opcodeIndex++;
      pc++;
    }
    this.debugInfo = debugInfo;
    /* eslint-disable */
    // console.log(debugInfo)
    // debugInfo.forEach(d => console.log(d));
  }

  displayDisaasembled() {
    this.debugInfo.forEach(d => console.log(d));
  }
}
