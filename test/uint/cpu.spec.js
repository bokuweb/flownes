import 'babel-polyfill';
import assert from 'power-assert';
import CPU from '../../src/cpu';
import RAM from '../../src/ram';
import ROM from '../../src/rom';
import * as op from '../../src/cpu/opcode';

const defaultRegistors = {
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

export default class Bus {
  ram: RAM;
  bus: Bus;
  programROM: ROM;

  constructor(ram: RAM, programROM: ROM) {
    this.ram = ram;
    this.programROM = programROM;
  }

  cpuRead(addr: Word): Byte {
    if (addr >= 0x8000) {
      return this.programROM.read(addr - 0x8000);
    }
    return this.ram.read(addr);
  }

  cpuWrite(addr: Word, data: Byte) {
    this.ram.write(addr, data);
  }
}

describe('cpu spec', () => {
  describe('instructions', () => {
    let cpu;
    let bus;
    let mockedROM;
    let mockedMemory;

    beforeEach(() => {
      mockedMemory = new RAM(0x10000);
    });

    describe('LDA', () => {
      it('LDA_IMM', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_IMM, 0xAA]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          A: 0xAA,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDA_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xA5, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          A: 0xAA,
        };
        assert.equal(cycle, 3);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDA_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_ZEROX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        mockedMemory.write(0xAA, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          A: 0xAA,
          X: 0x05,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDA_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0x10A5, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8003,
          A: 0xAA,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDA_ABSX', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        mockedMemory.write(0x10AA, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8003,
          A: 0xAA,
          X: 0x05,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDA_ABSY', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_ABSY, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0x05;
        mockedMemory.write(0x10AA, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8003,
          A: 0xAA,
          Y: 0x05,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDA_INDX', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_INDX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        mockedMemory.write(0xAA, 0xA0);
        mockedMemory.write(0xA0, 0xDE);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          A: 0xDE,
          X: 0x05,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDA_INDY', () => {
        mockedROM = new ROM(new Uint8Array([op.LDA_INDY, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0x05;
        mockedMemory.write(0xA5, 0xA0);
        mockedMemory.write(0xA6, 0x10);
        mockedMemory.write(0x10A5, 0xDE);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          A: 0xDE,
          Y: 0x05,
        };
        assert.equal(cycle, 5);
        assert.deepEqual(cpu.registors, expected);
      });
    });

    describe('LDX', () => {
      it('LDX_IMM', () => {
        mockedROM = new ROM(new Uint8Array([op.LDX_IMM, 0xAA]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          X: 0xAA,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDX_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.LDX_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xA5, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          X: 0xAA,
        };
        assert.equal(cycle, 3);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDX_ZEROY', () => {
        mockedROM = new ROM(new Uint8Array([op.LDX_ZEROY, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0x05;
        mockedMemory.write(0xAA, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          X: 0xAA,
          Y: 0x05,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDX_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.LDX_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0x10A5, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8003,
          X: 0xAA,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDX_ABSY', () => {
        mockedROM = new ROM(new Uint8Array([op.LDX_ABSY, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0x05;
        mockedMemory.write(0x10AA, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8003,
          X: 0xAA,
          Y: 0x05,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });
    });

    describe('LDY', () => {
      it('LDY_IMM', () => {
        mockedROM = new ROM(new Uint8Array([op.LDY_IMM, 0xAA]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          Y: 0xAA,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDY_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.LDY_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xA5, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          Y: 0xAA,
        };
        assert.equal(cycle, 3);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDY_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.LDY_ZEROX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        mockedMemory.write(0xAA, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8002,
          Y: 0xAA,
          X: 0x05,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDY_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.LDY_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0x10A5, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8003,
          Y: 0xAA,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LDY_ABSX', () => {
        mockedROM = new ROM(new Uint8Array([op.LDY_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        mockedMemory.write(0x10AA, 0xAA);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, negative: true },
          PC: 0x8003,
          Y: 0xAA,
          X: 0x05,
        };
        assert.equal(cycle, 4);
        assert.deepEqual(cpu.registors, expected);
      });
    });

    describe('STA', () => {
      it('STA_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_ZERO, 0xDE]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0xDE);
        assert.equal(cycle, 3);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_ZEROX, 0xA0]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        cpu.registors.A = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0xA5);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x10A5);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_ABSX without page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        cpu.registors.A = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x10AA);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_ABSX with page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x65;
        cpu.registors.A = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x110A);
        assert.equal(cycle, 5);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_ABSY without page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_ABSY, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0x05;
        cpu.registors.A = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x10AA);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_ABSY with page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_ABSY, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0x65;
        cpu.registors.A = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x110A);
        assert.equal(cycle, 5);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_INDX', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_INDX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xA5;
        cpu.registors.X = 0x05;
        mockedMemory.write(0xAA, 0xDE);
        mockedMemory.write(0xAB, 0x10);
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x10DE);
        assert.equal(cycle, 6);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_INDY without page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_INDY, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xA5;
        cpu.registors.Y = 0x05;
        mockedMemory.write(0xA5, 0xDE);
        mockedMemory.write(0xA6, 0x10);
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x10E3);
        assert.equal(cycle, 6);
        assert.deepEqual(data, 0xA5);
      });

      it('STA_INDY with page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.STA_INDY, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xA5;
        cpu.registors.Y = 0x25;
        mockedMemory.write(0xA5, 0xDE);
        mockedMemory.write(0xA6, 0x10);
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x1103);
        assert.equal(cycle, 7);
        assert.deepEqual(data, 0xA5);
      });
    });

    describe('STX', () => {
      it('STX_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.STX_ZERO, 0xDE]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0xDE);
        assert.equal(cycle, 3);
        assert.deepEqual(data, 0xA5);
      });

      it('STX_ZEROY', () => {
        mockedROM = new ROM(new Uint8Array([op.STX_ZEROY, 0xA0]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0xA5;
        cpu.registors.Y = 0x05;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0xA5);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });

      it('STX_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.STX_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x10A5);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });
    });

    describe('STY', () => {
      it('STY_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.STY_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0xA5);
        assert.equal(cycle, 3);
        assert.deepEqual(data, 0xA5);
      });

      it('STY_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.STY_ZEROX, 0xA0]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        cpu.registors.Y = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0xA5);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });

      it('STY_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.STY_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.Y = 0xA5;
        const cycle = cpu.exec();
        const data = mockedMemory.read(0x10A5);
        assert.equal(cycle, 4);
        assert.deepEqual(data, 0xA5);
      });
    });

    it('SEI', () => {
      mockedROM = new ROM(new Uint8Array([op.SEI]));
      bus = new Bus(mockedMemory, mockedROM);
      cpu = new CPU(bus);
      cpu.registors.PC = 0x8000;
      const cycle = cpu.exec();
      const expected = {
        ...defaultRegistors,
        P: { ...defaultRegistors.P, interrupt: true },
        PC: 0x8001,
      };
      assert.equal(cycle, 2);
      assert.deepEqual(cpu.registors, expected);
    });

    it('CLI', () => {
      mockedROM = new ROM(new Uint8Array([op.CLI]));
      bus = new Bus(mockedMemory, mockedROM);
      cpu = new CPU(bus);
      cpu.registors.PC = 0x8000;
      const cycle = cpu.exec();
      const expected = {
        ...defaultRegistors,
        P: { ...defaultRegistors.P, interrupt: false },
        PC: 0x8001,
      };
      assert.equal(cycle, 2);
      assert.deepEqual(cpu.registors, expected);
    });

    describe('LSR', () => {
      it('LSR', () => {
        mockedROM = new ROM(new Uint8Array([op.LSR]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xa5;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true },
          PC: 0x8001,
          A: 0x52,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LSR_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.LSR_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xA5, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 5);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xA5), 0x77);
      });

      it('LSR_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.LSR_ZEROX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xAA, 0xEF);
        cpu.registors.X = 0x05;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          X: 0x05,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xAA), 0x77);
      });

      it('LSR_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.LSR_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0x10A5, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10A5), 0x77);
      });

      it('LSR_ABSX without page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.LSR_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        mockedMemory.write(0x10AA, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0x05,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10AA), 0x77);
      });

      it('LSR_ABSX with page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.LSR_ABSX, 0x01, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0xFF;
        mockedMemory.write(0x1100, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0xFF,
        };
        assert.equal(cycle, 7);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x1100), 0x77);
      });
    });

    describe('ASL', () => {
      it('ASL', () => {
        mockedROM = new ROM(new Uint8Array([op.ASL]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xa5;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true },
          PC: 0x8001,
          A: 0x4A,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('ASL_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.ASL_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xA5, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 5);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xA5), 0xDE);
      });

      it('ASL_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.ASL_ZEROX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xAA, 0xEF);
        cpu.registors.X = 0x05;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          X: 0x05,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xAA), 0xDE);
      });

      it('ASL_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.ASL_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0x10A5, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10A5), 0xDE);
      });

      it('ASL_ABSX without page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.ASL_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0x05;
        mockedMemory.write(0x10AA, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0x05,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10AA), 0xDE);
      });

      it('ASL_ABSX with page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.ASL_ABSX, 0x01, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.X = 0xFF;
        mockedMemory.write(0x1100, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0xFF,
        };
        assert.equal(cycle, 7);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x1100), 0xDE);
      });
    });

    describe('ROR', () => {
      it('ROR', () => {
        mockedROM = new ROM(new Uint8Array([op.ROR]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.A = 0xa5;
        cpu.registors.P.carry = true;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true },
          PC: 0x8001,
          A: 0xD2,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('ROR_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.ROR_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xA5, 0xEF);
        cpu.registors.P.carry = true;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 5);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xA5), 0xF7);
      });

      it('ROR_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.ROR_ZEROX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xAA, 0xEF);
        cpu.registors.P.carry = true;
        cpu.registors.X = 0x05;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          X: 0x05,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xAA), 0xF7);
      });

      it('ROR_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.ROR_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0x10A5, 0xEF);
        cpu.registors.P.carry = true;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10A5), 0xF7);
      });

      it('ROR_ABSX without page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.ROR_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.P.carry = true;
        cpu.registors.X = 0x05;
        mockedMemory.write(0x10AA, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0x05,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10AA), 0xF7);
      });

      it('ROR_ABSX with page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.ROR_ABSX, 0x01, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.P.carry = true;
        cpu.registors.X = 0xFF;
        mockedMemory.write(0x1100, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0xFF,
        };
        assert.equal(cycle, 7);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x1100), 0xF7);
      });
    });

    describe('ROL', () => {
      it('ROL', () => {
        mockedROM = new ROM(new Uint8Array([op.ROL]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.P.carry = true;
        cpu.registors.A = 0xa5;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true },
          PC: 0x8001,
          A: 0x4B,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('ROL_ZERO', () => {
        mockedROM = new ROM(new Uint8Array([op.ROL_ZERO, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xA5, 0xEF);
        cpu.registors.P.carry = true;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 5);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xA5), 0xDF);
      });

      it('ROL_ZEROX', () => {
        mockedROM = new ROM(new Uint8Array([op.ROL_ZEROX, 0xA5]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0xAA, 0xEF);
        cpu.registors.P.carry = true;
        cpu.registors.X = 0x05;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          X: 0x05,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8002,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0xAA), 0xDF);
      });

      it('ROL_ABS', () => {
        mockedROM = new ROM(new Uint8Array([op.ROL_ABS, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        mockedMemory.write(0x10A5, 0xEF);
        cpu.registors.P.carry = true;
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10A5), 0xDF);
      });

      it('ROL_ABSX without page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.ROL_ABSX, 0xA5, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.P.carry = true;
        cpu.registors.X = 0x05;
        mockedMemory.write(0x10AA, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0x05,
        };
        assert.equal(cycle, 6);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x10AA), 0xDF);
      });

      it('ROL_ABSX with page cross', () => {
        mockedROM = new ROM(new Uint8Array([op.ROL_ABSX, 0x01, 0x10]));
        bus = new Bus(mockedMemory, mockedROM);
        cpu = new CPU(bus);
        cpu.registors.PC = 0x8000;
        cpu.registors.P.carry = true;
        cpu.registors.X = 0xFF;
        mockedMemory.write(0x1100, 0xEF);
        const cycle = cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true, zero: true },
          PC: 0x8003,
          X: 0xFF,
        };
        assert.equal(cycle, 7);
        assert.deepEqual(cpu.registors, expected);
        assert.equal(mockedMemory.read(0x1100), 0xDF);
      });
    });
  });
});
