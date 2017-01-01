/* @flow */

import type { Byte, Word } from '../types/common';
import type EventEmitter from 'events';
import log from '../helper/log';
import * as op from './opcode';

import type { AddressingMode } from './opcode';

interface CpuStatus {
  negative: boolean;
  overflow: boolean;
  reserved: boolean;
  break: boolean;
  decimal: boolean;
  interrupt: boolean;
  zero: boolean;
  carry: boolean;
}

interface Registors {
  A: Byte;
  X: Byte;
  Y: Byte;
  P: CpuStatus;
  SP: Byte;
  PC: Word;
}

interface AddrOrDataAndAdditionalCycle {
  addrOrData: Word;
  additionalCycle: number;
}

const defaultRegistors: Registors = {
  A: 0x00,
  X: 0x00,
  Y: 0x00,
  P: {
    negative: false,
    overflow: false,
    reserved: true,
    break: true,
    decimal: false,
    interrupt: true,
    zero: false,
    carry: false,
  },
  SP: 0x01FF, // 0xFD?
  PC: 0x0000,
};

const bytes2Word = (bytes: number[]): Word => bytes[0] | (bytes[1] || 0x00) << 8;

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

  async reset(): Promise<void> {
    log.info('cpu reset...');
    this.registors = {
      ...defaultRegistors,
      P: { ...defaultRegistors.P }
    };
    const pc: Byte[] = await this.fetch(0xFFFC, 2);
    log.debug(`pc = ${bytes2Word(pc).toString(16)}`);
    this.registors.PC = bytes2Word(pc);
  }

  async getAddrOrDataAndAdditionalCycle(mode: AddressingMode): Promise<AddrOrDataAndAdditionalCycle> {
    switch (mode) {
      case 'accumulator': {
        return await {
          addrOrData: 0x00, // dummy
          additionalCycle: 0,
        }
      }
      case 'implied': {
        return await {
          addrOrData: 0x00, // dummy
          additionalCycle: 0,
        }
      }
      case 'immediate': {
        return await {
          addrOrData: bytes2Word(await this.fetch(this.registors.PC)),
          additionalCycle: 0,
        }
      }
      case 'relative': {
        const addr = bytes2Word(await this.fetch(this.registors.PC));
        return {
          addrOrData: addr < 0x80 ? addr + this.registors.PC : addr + this.registors.PC - 256,
          additionalCycle: 0,
        }
      }
      case 'zeroPage': {
        return {
          addrOrData: bytes2Word(await this.fetch(this.registors.PC)),
          additionalCycle: 0,
        }
      }
      case 'zeroPageX': {
        const addr = (await this.fetch(this.registors.PC))[0];
        return {
          addrOrData: (addr + this.registors.X) & 0xFF,
          additionalCycle: 0,
        }
      }
      case 'zeroPageY': {
        const addr = (await this.fetch(this.registors.PC))[0];
        return {
          addrOrData: (addr + this.registors.Y & 0xFF),
          additionalCycle: 0,
        }
      }
      case 'absolute': {
        return {
          addrOrData: bytes2Word(await this.fetch(this.registors.PC, 2)),
          additionalCycle: 0,
        }
      }
      case 'absoluteX': {
        const addr = bytes2Word(await this.fetch(this.registors.PC, 2));
        const additionalCycle = (addr & 0xFF00) !== ((addr + this.registors.X ) & 0xFF00) ? 1 : 0;
        return {
          addrOrData: addr + this.registors.X,
          additionalCycle,
        }
      }
      case 'absoluteY': {
        const addr = bytes2Word(await this.fetch(this.registors.PC, 2));
        const additionalCycle = (addr & 0xFF00) !== ((addr + this.registors.Y ) & 0xFF00) ? 1 : 0;
        return {
          addrOrData: addr + this.registors.Y,
          additionalCycle,
        }
      }
      case 'preIndexedIndirect': {
        const addr = (bytes2Word(await this.fetch(this.registors.PC)) + this.registors.X) & 0xFF;
        return {
          addrOrData: bytes2Word(await this.read(addr, 2)),
          additionalCycle: 0,
        }
      }
      case 'postIndexedIndirect': {
        const addrOrData = (await this.fetch(this.registors.PC))[0];
        const baseAddr = bytes2Word(await this.read(addrOrData, 2));
        const addr = baseAddr + this.registors.Y;
        return {
          addrOrData: addr,
          additionalCycle: (addr & 0xFF00) !== (baseAddr & 0xFF00) ? 1 : 0,
        }
      }
      case 'indirectAbsolute': {
        const addrOrData = bytes2Word(await this.fetch(this.registors.PC, 2));
        const addr = bytes2Word(await this.read(addrOrData, 2));
        return {
          addrOrData: addr,
          additionalCycle: 0,
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

  async execInstruction(baseName: string, addrOrData: Word, mode: AddressingMode): Promise<null> {
    switch(baseName) {
      case 'LDA': {
        this.registors.A = mode === 'immediate' ? addrOrData : (await this.read(addrOrData))[0];
        this.registors.P.negative = !!(this.registors.A & 0x80);
        this.registors.P.zero = !this.registors.A;
        break;
      }
      case 'LDX': {
        this.registors.X = mode === 'immediate' ? addrOrData : (await this.read(addrOrData))[0];
        this.registors.P.negative = !!(this.registors.X & 0x80);
        this.registors.P.zero = !this.registors.X;
        break;
      }
      case 'LDY': {
        this.registors.Y = mode === 'immediate' ? addrOrData : (await this.read(addrOrData))[0];
        this.registors.P.negative = !!(this.registors.Y & 0x80);
        this.registors.P.zero = !this.registors.Y;
        break;
      }
      case 'STA': {
        this.write(addrOrData, new Uint8Array([this.registors.A]));
        break;
      }
      case 'STX': {
        this.write(addrOrData, new Uint8Array([this.registors.X]));
        break;
      }
      case 'STY': {
        this.write(addrOrData, new Uint8Array([this.registors.Y]));
        break;
      }
      case 'TAX': {
        this.registors.X = this.registors.A;
        this.registors.P.negative = !!(this.registors.X & 0x80);
        this.registors.P.zero = !this.registors.X;
        break;
      }
      case 'TAY': {
        this.registors.Y = this.registors.A;
        this.registors.P.negative = !!(this.registors.Y & 0x80);
        this.registors.P.zero = !this.registors.Y;
        break;
      }
      case 'TSX': {
        this.registors.X = this.registors.SP;
        this.registors.P.negative = !!(this.registors.X & 0x80);
        this.registors.P.zero = !this.registors.X;
        break;
      }
      case 'TXA': {
        this.registors.A = this.registors.X;
        this.registors.P.negative = !!(this.registors.A & 0x80);
        this.registors.P.zero = !this.registors.A;
        break;
      }
      case 'TXS': {
        this.registors.SP = this.registors.X;
        this.registors.P.negative = !!(this.registors.SP & 0x80);
        this.registors.P.zero = !this.registors.SP;
        break;
      }
      case 'TYA': {
        this.registors.A = this.registors.Y;
        this.registors.P.negative = !!(this.registors.A & 0x80);
        this.registors.P.zero = !this.registors.A;
        break;
      }
      case 'ADC': {
        const data = mode === 'immediate' ? addrOrData : (await this.read(addrOrData))[0];
        const operated = data + this.registors.A + this.registors.P.carry;
        this.registors.P.overflow = !((this.registors.A ^ operated) & 0x80);
        this.registors.P.carry = operated > 0xFF;
        this.registors.P.negative = !!(operated & 0x80);
        this.registors.P.zero = !operated;
        this.registors.A = operated & 0xFF;
        break;
      }
      case 'ASL': {
        if (mode === 'accumulator') {
          const acc = this.registors.A;
          this.registors.P.carry = !!(acc & 0x80);
          this.registors.A = (acc << 1) & 0xFF;
        } else {
          const data = (await this.read(addrOrData))[0];
          this.registors.P.carry = !!(data & 0x80);
          this.write(addrOrData, new Uint8Array([(data << 1) & 0xFF]));
        }
        this.registors.P.negative = false;
        this.registors.P.zero = !this.registors.A;
        break;
      }
      case 'LSR': {
        if (mode === 'accumulator') {
          const acc = this.registors.A;
          this.registors.P.carry = !!(acc & 0x01);
          this.registors.A = acc >> 1;
        } else {
          const data = (await this.read(addrOrData))[0];
          this.registors.P.carry = !!(data & 0x01);
          this.write(addrOrData, new Uint8Array([data >> 1]));
        }
        this.registors.P.negative = false;
        this.registors.P.zero = !this.registors.A;
        break;
      }
      case 'ROR': {
        if (mode === 'accumulator') {
          const acc = this.registors.A;
          this.registors.A = acc >> 1 | (this.registors.P.carry ? 0x80 : 0x00);
          this.registors.P.carry = !!(acc & 0x01);
        } else {
          const data = (await this.read(addrOrData))[0];
          const writeData = data >> 1 | (this.registors.P.carry ? 0x80 : 0x00);
          this.write(addrOrData, new Uint8Array([writeData]));
          this.registors.P.carry = !!(data & 0x01);
        }
        this.registors.P.negative = false;
        this.registors.P.zero = !this.registors.A;
        break;
      }
      case 'ROL': {
        if (mode === 'accumulator') {
          const acc = this.registors.A;
          this.registors.A = (acc << 1) & 0xFF | (this.registors.P.carry ? 0x01 : 0x00);
          this.registors.P.carry = !!(acc & 0x80);

        } else {
          const data = (await this.read(addrOrData))[0];
          const writeData = (data << 1 | (this.registors.P.carry ? 0x01 : 0x00)) & 0xFF;
          this.write(addrOrData, new Uint8Array([writeData]));
          this.registors.P.carry = !!(data & 0x80);
        }
        this.registors.P.negative = false;
        this.registors.P.zero = !this.registors.A;
        break;
      }
      case 'SEI': {
        this.registors.P.interrupt = true;
        break;
      }
      case 'CLI': {
        this.registors.P.interrupt = false;
        break;
      }
      default: throw new Error('Unknown opecode ${opecode} deteced.');
    }
    return await null;
  }

  async exec(): Promise<number> {
    const opcode = (await this.fetch(this.registors.PC))[0];
    const { fullName, baseName, mode, cycle } = op.dict[opcode.toString(16).toUpperCase()];
    const { addrOrData, additionalCycle } = await this.getAddrOrDataAndAdditionalCycle(mode);
    log.debug(`fullName = ${fullName}, baseName = ${baseName}, mode = ${mode}, cycle = ${cycle}`);
    await this.execInstruction(baseName, addrOrData, mode);
    return await cycle + additionalCycle;
  }
}
