/* @flow */

import type { Byte, Word } from '../types/common';
import type EventEmitter from 'events';
import log from '../helper/log';
import * as op from './opcode';

import type { AddressingMode } from './opcode';

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

export const defaultRegistors: Registors = {
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

const bytes2Word = (bytes: number[]) => bytes[0] | (bytes[1] || 0x00) << 8;

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
    const pc: number[] = await this.fetch(0xFFFC, 2);
    log.debug(`pc = ${bytes2Word(pc).toString(16)}`);
    this.registors.PC = bytes2Word(pc);
  }

  async getOpeland(mode: AddressingMode): Promise<Byte[]> {
    switch (mode) {
      case 'accumulator':
      case 'implied': return await []; // Ignored.
      case 'relative':
      case 'zeroPage': return await this.fetch(this.registors.PC);
      case 'absolute': return await this.fetch(this.registors.PC, 2);
      default: throw new Error(`Unknown addressing mode ${mode} detected.`);
    }
  }

  fetch(addr: Word, size?: Byte = 1): Promise<Array<Byte>> {
    this.registors.PC += size;
    return this.read(addr, size);
  }

  read(addr: Word, size?: Byte = 1): Promise<Array<Byte>> {
    return new Promise((resolve) => {
      this.emitter.on('cpu:read-response', resolve);
      this.emitter.emit('cpu:read', [addr, size]);
    });
  }

  write(addr: Word, data: Byte[]) {
    this.emitter.emit('cpu:write', data);
  }

  async execInstruction(opcode: Byte, opeland: Byte[], mode: AddressingMode) {
    switch(opcode) {
      case op.LSR: {
        if (mode === 'accumulator') {
          const acc = this.registors.A;
          this.registors.P.carry = !!(acc & 0x01);
          this.registors.A = acc >> 1;
        } else {
          const addr = bytes2Word(opeland);
          const data = (await this.read(addr))[0];
          this.registors.P.carry = !!(data & 0x01);
          await this.write(addr, [data >> 1]);
        }
      }
      case op.SEI: {
        return this.registors.P.interupt = true;
      }
      case op.CLI: {
        return this.registors.P.interupt = false;
      }
      default: throw new Error('Unknown opecode ${opecode} deteced.');
    }
  }

  async exec(): Promise<number> {
    const opcode = (await this.fetch(this.registors.PC))[0];
    const { fullName, baseName, mode, cycle } = op.dict[opcode.toString(16)];
    const opeland = await this.getOpeland(mode);
    log.debug(`fullName = ${fullName}, baseName = ${baseName}, mode = ${mode}, cycle = ${cycle}`);
    await this.execInstruction(opcode, opeland, mode);
    return await cycle;
  }
}
