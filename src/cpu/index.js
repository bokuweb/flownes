/* @flow */

import type { Byte, Word } from '../types/common';
import log from '../helper/log';
import CpuBus from '../bus/cpu-bus';
import Interrupts from '../interrupts';
import * as op from './opcode';

import type { AddressingMode, OpecodeProps } from './opcode';

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

interface Registers {
  A: Byte;
  X: Byte;
  Y: Byte;
  P: CpuStatus;
  SP: Word;
  PC: Word;
}

interface AddrOrDataAndAdditionalCycle {
  addrOrData: Word;
  additionalCycle: number;
}

const defaultRegisters: Registers = {
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
  SP: 0x01FD,
  PC: 0x0000,
};

export default class Cpu {

  registers: Registers;
  hasBranched: boolean;
  bus: CpuBus;
  opecodeList: Array<OpecodeProps>;
  interrupts: Interrupts;

  constructor(bus: CpuBus, interrupts: Interrupts) {
    this.registers = {
      ...defaultRegisters,
      P: { ...defaultRegisters.P },
    };
    this.hasBranched = false;
    this.bus = bus;
    this.opecodeList = [];
    this.interrupts = interrupts;

    Object.keys(op.dict).forEach((key: string) => {
      const { fullName, baseName, mode, cycle } = op.dict[key];
      this.opecodeList[parseInt(key, 16)] = {
        fullName, baseName, mode, cycle,
      }
    });
  }

  reset() {
    log.info('cpu reset...');
    this.registers = {
      ...defaultRegisters,
      P: { ...defaultRegisters.P }
    };
    // HACK: For rom, not set reset handler.
    this.registers.PC = this.read(0xFFFC, "Word") || 0x8000;
    log.info(`pc = ${(this.registers.PC).toString(16)}`);
  }

  getAddrOrDataAndAdditionalCycle(mode: AddressingMode): AddrOrDataAndAdditionalCycle {
    switch (mode) {
      case 'accumulator': {
        return {
          addrOrData: 0x00, // dummy
          additionalCycle: 0,
        }
      }
      case 'implied': {
        return {
          addrOrData: 0x00, // dummy
          additionalCycle: 0,
        };
      }
      case 'immediate': {
        return {
          addrOrData: this.fetch(this.registers.PC),
          additionalCycle: 0,
        }
      }
      case 'relative': {
        const baseAddr = this.fetch(this.registers.PC);
        const addr = baseAddr < 0x80 ? baseAddr + this.registers.PC : baseAddr + this.registers.PC - 256;
        return {
          addrOrData: addr,
          additionalCycle: (addr & 0xFF00) !== (this.registers.PC & 0xFF00) ? 1 : 0,
        }
      }
      case 'zeroPage': {
        return {
          addrOrData: this.fetch(this.registers.PC),
          additionalCycle: 0,
        }
      }
      case 'zeroPageX': {
        const addr = this.fetch(this.registers.PC);
        return {
          addrOrData: (addr + this.registers.X) & 0xFF,
          additionalCycle: 0,
        }
      }
      case 'zeroPageY': {
        const addr = this.fetch(this.registers.PC);
        return {
          addrOrData: (addr + this.registers.Y & 0xFF),
          additionalCycle: 0,
        }
      }
      case 'absolute': {
        return {
          addrOrData: (this.fetch(this.registers.PC, "Word")),
          additionalCycle: 0,
        }
      }
      case 'absoluteX': {
        const addr = (this.fetch(this.registers.PC, "Word"));
        const additionalCycle = (addr & 0xFF00) !== ((addr + this.registers.X) & 0xFF00) ? 1 : 0;
        return {
          addrOrData: (addr + this.registers.X) & 0xFFFF,
          additionalCycle,
        }
      }
      case 'absoluteY': {
        const addr = (this.fetch(this.registers.PC, "Word"));
        const additionalCycle = (addr & 0xFF00) !== ((addr + this.registers.Y) & 0xFF00) ? 1 : 0;
        return {
          addrOrData: (addr + this.registers.Y) & 0xFFFF,
          additionalCycle,
        }
      }
      case 'preIndexedIndirect': {
        const baseAddr = (this.fetch(this.registers.PC) + this.registers.X) & 0xFF;
        const addr = this.read(baseAddr) + (this.read((baseAddr + 1) & 0xFF) << 8);
        return {
          addrOrData: addr & 0xFFFF,
          additionalCycle: (addr & 0xFF00) !== (baseAddr & 0xFF00) ? 1 : 0,
        }
      }
      case 'postIndexedIndirect': {
        const addrOrData = this.fetch(this.registers.PC);
        const baseAddr = this.read(addrOrData) + (this.read((addrOrData + 1) & 0xFF) << 8);
        const addr = baseAddr + this.registers.Y;
        // if (addr > 0xFFFF) debugger;
        return {
          addrOrData: addr & 0xFFFF,
          additionalCycle: (addr & 0xFF00) !== (baseAddr & 0xFF00) ? 1 : 0,
        }
      }
      case 'indirectAbsolute': {
        const addrOrData = this.fetch(this.registers.PC, "Word");
        const addr = this.read(addrOrData) + (this.read((addrOrData & 0xFF00) | (((addrOrData & 0xFF) + 1) & 0xFF)) << 8);
        return {
          addrOrData: addr & 0xFFFF,
          additionalCycle: 0,
        }
      }
      default: throw new Error(`Unknown addressing mode ${mode} detected.`);
    }
  }

  fetch(addr: Word, size?: "Byte" | "Word"): Byte {
    this.registers.PC += size === "Word" ? 2 : 1;
    return this.read(addr, size);
  }

  read(addr: Word, size?: "Byte" | "Word"): Byte {
    addr &= 0xFFFF;
    return size === "Word"
      ? (this.bus.readByCpu(addr) | this.bus.readByCpu(addr + 1) << 8)
      : this.bus.readByCpu(addr);
  }

  write(addr: Word, data: Byte) {
    this.bus.writeByCpu(addr, data);
  }

  push(data: Byte) {
    this.write(0x100 | (this.registers.SP & 0xFF), data);
    this.registers.SP--;
  }

  pop(): Byte {
    this.registers.SP++;
    return this.read(0x100 | (this.registers.SP & 0xFF));
  }

  branch(addr: Word) {
    this.registers.PC = addr;
    this.hasBranched = true;
  }

  pushStatus() {
    const status: Byte = (+this.registers.P.negative) << 7 |
      (+this.registers.P.overflow) << 6 |
      (+this.registers.P.reserved) << 5 |
      (+this.registers.P.break) << 4 |
      (+this.registers.P.decimal) << 3 |
      (+this.registers.P.interrupt) << 2 |
      (+this.registers.P.zero) << 1 |
      (+this.registers.P.carry);
    this.push(status);
  }

  popStatus() {
    const status = this.pop();
    this.registers.P.negative = !!(status & 0x80);
    this.registers.P.overflow = !!(status & 0x40);
    this.registers.P.reserved = !!(status & 0x20);
    this.registers.P.break = !!(status & 0x10);
    this.registers.P.decimal = !!(status & 0x08);
    this.registers.P.interrupt = !!(status & 0x04);
    this.registers.P.zero = !!(status & 0x02);
    this.registers.P.carry = !!(status & 0x01);
  }

  popPC() {
    this.registers.PC = this.pop();
    this.registers.PC += (this.pop() << 8);
  }

  execInstruction(baseName: string, addrOrData: Word, mode: AddressingMode) {
    this.hasBranched = false;
    if ((baseName === 'LDA' && !this.first) || this.registers.PC === 32813) {
      // this.first = true;
      // debugger
    }
    switch (baseName) {
      case 'LDA': {
        // if (mode === 'postIndexedIndirect') debugger;
        this.registers.A = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        // if (typeof this.registers.A === 'undefined') debugger;
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !this.registers.A;
        break;
      }
      case 'LDX': {
        this.registers.X = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        this.registers.P.negative = !!(this.registers.X & 0x80);
        this.registers.P.zero = !this.registers.X;
        break;
      }
      case 'LDY': {
        this.registers.Y = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        this.registers.P.negative = !!(this.registers.Y & 0x80);
        this.registers.P.zero = !this.registers.Y;
        break;
      }
      case 'STA': {
        // const addr = mode === 'preIndexedIndirect' ? this.read(addrOrData) : addrOrData;
        this.write(addrOrData, this.registers.A);
        break;
      }
      case 'STX': {
        this.write(addrOrData, this.registers.X);
        break;
      }
      case 'STY': {
        this.write(addrOrData, this.registers.Y);
        break;
      }
      case 'TAX': {
        this.registers.X = this.registers.A;
        this.registers.P.negative = !!(this.registers.X & 0x80);
        this.registers.P.zero = !this.registers.X;
        break;
      }
      case 'TAY': {
        this.registers.Y = this.registers.A;
        this.registers.P.negative = !!(this.registers.Y & 0x80);
        this.registers.P.zero = !this.registers.Y;
        break;
      }
      case 'TSX': {
        this.registers.X = this.registers.SP & 0xFF;
        this.registers.P.negative = !!(this.registers.X & 0x80);
        this.registers.P.zero = !this.registers.X;
        break;
      }
      case 'TXA': {
        this.registers.A = this.registers.X;
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !this.registers.A;
        break;
      }
      case 'TXS': {
        this.registers.SP = this.registers.X + 0x0100;
        // TODO: It's unneeded ?
        // this.registers.P.negative = !!(this.registers.SP & 0x80);
        // this.registers.P.zero = !this.registers.SP;
        break;
      }
      case 'TYA': {
        this.registers.A = this.registers.Y;
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !this.registers.A;
        break;
      }
      case 'ADC': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const operated = data + this.registers.A + this.registers.P.carry;
        const overflow = (!(((this.registers.A ^ data) & 0x80) != 0) && (((this.registers.A ^ operated) & 0x80)) != 0);
        this.registers.P.overflow = overflow;
        this.registers.P.carry = operated > 0xFF;
        this.registers.P.negative = !!(operated & 0x80);
        this.registers.P.zero = !(operated & 0xFF);
        this.registers.A = operated & 0xFF;
        break;
      }
      case 'AND': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const operated = data & this.registers.A;
        this.registers.P.negative = !!(operated & 0x80);
        this.registers.P.zero = !operated;
        this.registers.A = operated & 0xFF;
        break;
      }
      case 'ASL': {
        if (mode === 'accumulator') {
          const acc = this.registers.A;
          this.registers.P.carry = !!(acc & 0x80);
          this.registers.A = (acc << 1) & 0xFF;
          this.registers.P.zero = !this.registers.A;
          this.registers.P.negative = !!(this.registers.A & 0x80);
        } else {
          const data = this.read(addrOrData);
          this.registers.P.carry = !!(data & 0x80);
          const shifted = (data << 1) & 0xFF;
          this.write(addrOrData, shifted);
          this.registers.P.zero = !shifted;
          this.registers.P.negative = !!(shifted & 0x80);
        }
        break;
      }
      case 'BIT': {
        const data = this.read(addrOrData);
        this.registers.P.negative = !!(data & 0x80);
        this.registers.P.overflow = !!(data & 0x40);
        this.registers.P.zero = !(this.registers.A & data);
        break;
      }
      case 'CMP': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const compared = this.registers.A - data;
        this.registers.P.carry = compared >= 0;
        this.registers.P.negative = !!(compared & 0x80);
        this.registers.P.zero = !(compared & 0xff);
        break;
      }
      case 'CPX': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const compared = this.registers.X - data;
        this.registers.P.carry = compared >= 0;
        this.registers.P.negative = !!(compared & 0x80);
        this.registers.P.zero = !(compared & 0xff);
        break;
      }
      case 'CPY': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const compared = this.registers.Y - data;
        this.registers.P.carry = compared >= 0;
        this.registers.P.negative = !!(compared & 0x80);
        this.registers.P.zero = !(compared & 0xff);
        break;
      }
      case 'DEC': {
        const data = (this.read(addrOrData) - 1) & 0xFF;
        this.registers.P.negative = !!(data & 0x80);
        this.registers.P.zero = !data;
        this.write(addrOrData, data);
        break;
      }
      case 'DEX': {
        this.registers.X = (this.registers.X - 1) & 0xFF;
        this.registers.P.negative = !!(this.registers.X & 0x80);
        this.registers.P.zero = !this.registers.X;
        break;
      }
      case 'DEY': {
        this.registers.Y = (this.registers.Y - 1) & 0xFF;
        this.registers.P.negative = !!(this.registers.Y & 0x80);
        this.registers.P.zero = !this.registers.Y;
        break;
      }
      case 'EOR': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const operated = data ^ this.registers.A;
        this.registers.P.negative = !!(operated & 0x80);
        this.registers.P.zero = !operated;
        this.registers.A = operated & 0xFF;
        break;
      }
      case 'INC': {
        const data = (this.read(addrOrData) + 1) & 0xFF;
        this.registers.P.negative = !!(data & 0x80);
        this.registers.P.zero = !data;
        this.write(addrOrData, data);
        break;
      }
      case 'INX': {
        this.registers.X = (this.registers.X + 1) & 0xFF;
        this.registers.P.negative = !!(this.registers.X & 0x80);
        this.registers.P.zero = !this.registers.X;
        break;
      }
      case 'INY': {
        this.registers.Y = (this.registers.Y + 1) & 0xFF;
        this.registers.P.negative = !!(this.registers.Y & 0x80);
        this.registers.P.zero = !this.registers.Y;
        break;
      }
      case 'LSR': {
        if (mode === 'accumulator') {
          const acc = this.registers.A & 0xFF;
          this.registers.P.carry = !!(acc & 0x01);
          this.registers.A = acc >> 1;
          this.registers.P.zero = !this.registers.A;
        } else {
          const data = this.read(addrOrData);
          this.registers.P.carry = !!(data & 0x01);
          this.registers.P.zero = !(data >> 1);
          this.write(addrOrData, data >> 1);
        }
        this.registers.P.negative = false;
        break;
      }
      case 'ORA': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const operated = data | this.registers.A;
        this.registers.P.negative = !!(operated & 0x80);
        this.registers.P.zero = !operated;
        this.registers.A = operated & 0xFF;
        break;
      }
      case 'ROL': {
        if (mode === 'accumulator') {
          const acc = this.registers.A;
          this.registers.A = (acc << 1) & 0xFF | (this.registers.P.carry ? 0x01 : 0x00);
          this.registers.P.carry = !!(acc & 0x80);
          this.registers.P.zero = !this.registers.A;
          this.registers.P.negative = !!(this.registers.A & 0x80);
        } else {
          const data = this.read(addrOrData);
          const writeData = (data << 1 | (this.registers.P.carry ? 0x01 : 0x00)) & 0xFF;
          this.write(addrOrData, writeData);
          this.registers.P.carry = !!(data & 0x80);
          this.registers.P.zero = !writeData;
          this.registers.P.negative = !!(writeData & 0x80);
        }
        break;
      }
      case 'ROR': {
        if (mode === 'accumulator') {
          const acc = this.registers.A;
          this.registers.A = acc >> 1 | (this.registers.P.carry ? 0x80 : 0x00);
          this.registers.P.carry = !!(acc & 0x01);
          this.registers.P.zero = !this.registers.A;
          this.registers.P.negative = !!(this.registers.A & 0x80);
        } else {
          const data = this.read(addrOrData);
          const writeData = data >> 1 | (this.registers.P.carry ? 0x80 : 0x00);
          this.write(addrOrData, writeData);
          this.registers.P.carry = !!(data & 0x01);
          this.registers.P.zero = !writeData;
          this.registers.P.negative = !!(writeData & 0x80);
        }
        break;
      }
      case 'SBC': {
        const data = mode === 'immediate' ? addrOrData : this.read(addrOrData);
        const operated = this.registers.A - data - (this.registers.P.carry ? 0 : 1);
        const overflow = (((this.registers.A ^ operated) & 0x80) != 0 && ((this.registers.A ^ data) & 0x80) != 0);
        this.registers.P.overflow = overflow;
        this.registers.P.carry = operated >= 0;
        this.registers.P.negative = !!(operated & 0x80);
        this.registers.P.zero = !(operated & 0xFF);
        this.registers.A = operated & 0xFF;
        break;
      }
      case 'PHA': {
        this.push(this.registers.A);
        break;
      }
      case 'PHP': {
        this.registers.P.break = true;
        this.pushStatus();
        break;
      }
      case 'PLA': {
        this.registers.A = this.pop();
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !this.registers.A;
        break;
      }
      case 'PLP': {
        this.popStatus();
        this.registers.P.reserved = true;
        break;
      }
      case 'JMP': {
        this.registers.PC = addrOrData;
        break;
      }
      case 'JSR': {
        const PC = this.registers.PC - 1;
        this.push((PC >> 8) & 0xFF);
        this.push(PC & 0xFF);
        this.registers.PC = addrOrData;
        break;
      }
      case 'RTS': {
        this.popPC();
        this.registers.PC++;
        break;
      }
      case 'RTI': {
        this.popStatus();
        this.popPC();
        this.registers.P.reserved = true;
        break;
      }
      case 'BCC': {
        if (!this.registers.P.carry) this.branch(addrOrData);
        break;
      }
      case 'BCS': {
        if (this.registers.P.carry) this.branch(addrOrData);
        break;
      }
      case 'BEQ': {
        if (this.registers.P.zero) this.branch(addrOrData);
        break;
      }
      case 'BMI': {
        if (this.registers.P.negative) this.branch(addrOrData);
        break;
      }
      case 'BNE': {
        if (!this.registers.P.zero) this.branch(addrOrData);
        break;
      }
      case 'BPL': {
        if (!this.registers.P.negative) this.branch(addrOrData);
        break;
      }
      case 'BVS': {
        if (this.registers.P.overflow) this.branch(addrOrData);
        break;
      }
      case 'BVC': {
        if (!this.registers.P.overflow) this.branch(addrOrData);
        break;
      }
      case 'CLD': {
        this.registers.P.decimal = false;
        break;
      }
      case 'CLC': {
        this.registers.P.carry = false;
        break;
      }
      case 'CLI': {
        this.registers.P.interrupt = false;
        break;
      }
      case 'CLV': {
        this.registers.P.overflow = false;
        break;
      }
      case 'SEC': {
        this.registers.P.carry = true;
        break;
      }
      case 'SEI': {
        this.registers.P.interrupt = true;
        break;
      }
      case 'SED': {
        this.registers.P.decimal = true;
        break;
      }
      case 'BRK': {
        const interrupt = this.registers.P.interrupt;
        this.registers.PC++;
        this.push((this.registers.PC >> 8) & 0xFF);
        this.push(this.registers.PC & 0xFF);
        this.registers.P.break = true;
        this.pushStatus();
        this.registers.P.interrupt = true;
        // Ignore interrupt when already set.
        if (!interrupt) {
          this.registers.PC = this.read(0xFFFE, "Word");
        }
        this.registers.PC--;
        break;
      }
      case 'NOP': {
        break;
      }
      // Unofficial Opecode
      case 'NOPD': {
        this.registers.PC++;
        break;
      }
      case 'NOPI': {
        this.registers.PC += 2;
        break;
      }
      case 'LAX': {
        this.registers.A = this.registers.X = this.read(addrOrData);
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !this.registers.A;
        break;
      }
      case 'SAX': {
        const operated = this.registers.A & this.registers.X;
        this.write(addrOrData, operated);
        break;
      }
      case 'DCP': {
        const operated = (this.read(addrOrData) - 1) & 0xFF;
        this.registers.P.negative = !!(((this.registers.A - operated) & 0x1FF) & 0x80);
        this.registers.P.zero = !((this.registers.A - operated) & 0x1FF);
        this.write(addrOrData, operated);
        break;
      }
      case 'ISB': {
        const data = (this.read(addrOrData) + 1) & 0xFF;
        const operated = (~data & 0xFF) + this.registers.A + this.registers.P.carry;
        const overflow = (!(((this.registers.A ^ data) & 0x80) != 0) && (((this.registers.A ^ operated) & 0x80)) != 0);
        this.registers.P.overflow = overflow;
        this.registers.P.carry = operated > 0xFF;
        this.registers.P.negative = !!(operated & 0x80);
        this.registers.P.zero = !(operated & 0xFF);
        this.registers.A = operated & 0xFF;
        this.write(addrOrData, data);
        break;
      }
      case 'SLO': {
        let data = this.read(addrOrData);
        this.registers.P.carry = !!(data & 0x80);
        data = (data << 1) & 0xFF;
        this.registers.A |= data;
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !(this.registers.A & 0xFF);
        this.write(addrOrData, data);
        break;
      }
      case 'RLA': {
        const data = (this.read(addrOrData) << 1) + this.registers.P.carry;
        this.registers.P.carry = !!(data & 0x100);
        this.registers.A = (data & this.registers.A) & 0xFF;
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !(this.registers.A & 0xFF);
        this.write(addrOrData, data);
        break;
      }
      case 'SRE': {
        let data = this.read(addrOrData);
        this.registers.P.carry = !!(data & 0x01)
        data >>= 1;
        this.registers.A ^= data;
        this.registers.P.negative = !!(this.registers.A & 0x80);
        this.registers.P.zero = !(this.registers.A & 0xFF);
        this.write(addrOrData, data);
        break;
      }
      case 'RRA': {
        let data = this.read(addrOrData);
        const carry = !!(data & 0x01);
        data = (data >> 1) | (this.registers.P.carry ? 0x80 : 0x00);
        const operated = data + this.registers.A + carry;
        const overflow = (!(((this.registers.A ^ data) & 0x80) != 0) && (((this.registers.A ^ operated) & 0x80)) != 0);
        this.registers.P.overflow = overflow;
        this.registers.P.negative = !!(operated & 0x80);
        this.registers.P.zero = !(operated & 0xFF);
        this.registers.A = operated & 0xFF;
        this.registers.P.carry = operated > 0xFF;
        this.write(addrOrData, data);
        break;
      }
      default: throw new Error(`Unknown opecode ${baseName} detected.`);
    }
    if (typeof this.registers.A === 'undefined') debugger;
  }

  processNmi() {
    this.interrupts.deassertNmi();
    this.registers.P.break = false;
    this.push((this.registers.PC >> 8) & 0xFF);
    this.push(this.registers.PC & 0xFF);
    this.pushStatus();
    this.registers.P.interrupt = true;
    this.registers.PC = this.read(0xFFFA, "Word");
  }

  processIrq() {
    if (this.registers.P.interrupt) return;
    this.interrupts.deassertIrq();
    this.registers.P.break = false;
    this.push((this.registers.PC >> 8) & 0xFF);
    this.push(this.registers.PC & 0xFF);
    this.pushStatus();
    this.registers.P.interrupt = true;
    this.registers.PC = this.read(0xFFFE, "Word");
  }

  exec(): number {
    if (this.interrupts.isNmiAssert) {
      // console.log('rcv nmi!!!!!!!!!!!!!!!!-----------------------------------------------')
      this.processNmi();
    }
    // if (this.interrupts.isIrqAssert) this.processIrq();
    const opecode = this.fetch(this.registers.PC);
    // console.log(opecode, this.registers.PC.toString(16))
    if (!this.opecodeList[opecode]) debugger;
    const { baseName, mode, cycle } = this.opecodeList[opecode];
    // console.log(baseName)

    const { addrOrData, additionalCycle } = this.getAddrOrDataAndAdditionalCycle(mode);
    // if (window.debug) {
    const { PC, SP, A, X, Y, P } = this.registers;
    const { fullName } = this.opecodeList[opecode];
    // log.debug(`PC = ${PC.toString(16)}, SP = ${SP}, A = ${A}, X = ${X} , Y = ${Y}`,
    // `carry = ${P.carry.toString()}, zero = ${P.zero.toString()}, negative = ${P.negative.toString()}, overflow = ${P.overflow.toString()}`);
    // console.log(`fullName = ${fullName}, PC = ${PC.toString(16)}`);
    // }
    this.execInstruction(baseName, addrOrData, mode);
    return cycle + additionalCycle + (this.hasBranched ? 1 : 0);
  }
}
