/* @flow */

import type { Byte, Word } from '../types/common';
import type EventEmitter from 'events';
import log from '../helper/log';
import * as op from './opcode';

type CpuStatus = {
  nagative: boolean;
  overflow: boolean;
  reserved: boolean;
  break: boolean;
  decimal: boolean;
  interupt: boolean;
  zero: boolean;
  carry: boolean;
};

type Registors = {
  A: Byte;
  X: Byte;
  Y: Byte;
  P: CpuStatus;
  SP: Byte;
  PC: Word;
};

const defaultRegistors: Registors = {
  A: 0x00,
  X: 0x00,
  Y: 0x00,
  P: {
    nagative: false,
    overflow: false,
    reserved: true,
    break: true,
    decimal: false,
    interupt: true,
    zero: false,
    carry: false,
  },
  SP: 0x01FF, // 0xFD?
  PC: 0x0000,
};

export default class Cpu {

  registors: Registors;
  emitter: EventEmitter;

  constructor(emitter: EventEmitter) {
    this.registors = defaultRegistors;
    this.emitter = emitter;
  }

  async reset() {
    log.info('cpu reset...');
    this.registors = defaultRegistors;
    const pc = await this.fetch(0xFFFC, 2);
    log.debug(`pc = ${(pc[0] | pc[1] << 8).toString(16)}`);
    this.registors.PC = pc[0] | pc[1] << 8;
  }

  fetch(addr: Word, size?: Byte = 1) {
    return new Promise((resolve) => {
      this.emitter.on('cpu:read-response', resolve);
      this.emitter.emit('cpu:read', [addr, size]);
    });
  }

  async exec() {
    const opcode = await this.fetch(this.registors.PC++);
    log.debug(`opcode = ${op.dict[opcode.toString(16)]}`);
  }
}
