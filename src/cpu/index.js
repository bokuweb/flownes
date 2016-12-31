/* @flow */

import type { Byte, Word } from '../types/common';
import type EventEmitter from 'events';
import log from '../helper/log';
import * as op from './opcode';

import type { AddressingMode } from './opcode';

interface CpuStatus {
  nagative: boolean;
  overflow: boolean;
  reserved: boolean;
  break: boolean;
  decimal: boolean;
  interupt: boolean;
  zero: boolean;
  carry: boolean;
};

interface Registors {
  A: Byte;
  X: Byte;
  Y: Byte;
  P: CpuStatus;
  SP: Byte;
  PC: Word;
};

interface OpelandAndAdditionalCycle {
  opeland: Word;
  additionalCycle: number;
}

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

const bytes2Word = (bytes: number[]) => bytes[0] | (bytes[1] || 0x00) << 8;

export default class Cpu {

  registors: Registors;
  emitter: EventEmitter;

  constructor(emitter: EventEmitter) {
    this.registors = {
      ...defaultRegistors,
      P: { ...defaultRegistors.P }
    };
    this.emitter = emitter;
  }

  async reset() {
    log.info('cpu reset...');
    this.registors = { ...defaultRegistors };
    const pc: number[] = await this.fetch(0xFFFC, 2);
    log.debug(`pc = ${bytes2Word(pc).toString(16)}`);
    this.registors.PC = bytes2Word(pc);
  }

  async getOpelandAndAdditionalCycle(mode: AddressingMode): Promise<OpelandAndAdditionalCycle> {
    switch (mode) {
      case 'accumulator': {
        return await {
          opeland: 0x00,
          additionalCycle: 0,
        }
      }
      case 'implied': {
        return await {
          opeland: 0x00,
          additionalCycle: 0,
        }
      }
      case 'relative': {
        return {
          opeland: bytes2Word(await this.fetch(this.registors.PC)),
          additionalCycle: 0,
        }
      }
      case 'zeroPage': {
        return {
          opeland: bytes2Word(await this.fetch(this.registors.PC)),
          additionalCycle: 0,
        }
      }
      case 'zeroPageX': {
        const addr = (await this.fetch(this.registors.PC))[0];
        return {
          opeland: (addr + this.registors.X) & 0xFF,
          additionalCycle: 0,
        }
      }
      case 'zeroPageY': {
        const addr = (await this.fetch(this.registors.PC))[0];
        return {
          opeland: (addr + this.registors.Y & 0xFF),
          additionalCycle: 0,
        }
      }
      case 'absolute': {
        return {
          opeland: bytes2Word(await this.fetch(this.registors.PC, 2)),
          additionalCycle: 0,
        }
      }
      case 'absoluteX': {
        const addr = bytes2Word(await this.fetch(this.registors.PC, 2));
        const additionalCycle = (addr & 0xFF00) !== ((addr + this.registors.X ) & 0xFF00) ? 1 : 0;
        return {
          opeland: addr + this.registors.X,
          additionalCycle,
        }
      }
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

  write(addr: Word, data: Uint8Array) {
    this.emitter.emit('cpu:write', [addr, data]);
  }

  async execInstruction(baseName: string, opeland: Word, mode: AddressingMode) {
    switch(baseName) {
      case 'ASL': {
        if (mode === 'accumulator') {
          const acc = this.registors.A;
          this.registors.P.carry = !!(acc & 0x80);
          this.registors.A = (acc << 1) & 0xFF;
          return;
        } else {
          const data = (await this.read(opeland))[0];
          this.registors.P.carry = !!(data & 0x80);
          await this.write(opeland, new Uint8Array([(data << 1) & 0xFF]));
          return;
        }
      }
      case 'LSR': {
        if (mode === 'accumulator') {
          const acc = this.registors.A;
          this.registors.P.carry = !!(acc & 0x01);
          this.registors.A = acc >> 1;
          return;
        } else {
          const data = (await this.read(opeland))[0];
          this.registors.P.carry = !!(data & 0x01);
          await this.write(opeland, new Uint8Array([data >> 1]));
          return;
        }
      }
      case 'SEI': {
        return this.registors.P.interupt = true;
      }
      case 'CLI': {
        return this.registors.P.interupt = false;
      }
      default: throw new Error('Unknown opecode ${opecode} deteced.');
    }
  }

  async exec(): Promise<number> {
    const opcode = (await this.fetch(this.registors.PC))[0];
    const { fullName, baseName, mode, cycle } = op.dict[opcode.toString(16).toUpperCase()];
    const { opeland, additionalCycle } = await this.getOpelandAndAdditionalCycle(mode);
    log.debug(`fullName = ${fullName}, baseName = ${baseName}, mode = ${mode}, cycle = ${cycle}`);
    await this.execInstruction(baseName, opeland, mode);
    return await cycle + additionalCycle;
  }
}
