import test from 'ava';
import CPU from '../../src/cpu';
import RAM from '../../src/ram';
import ROM from '../../src/rom';
import * as op from '../../src/cpu/opcode';

const defaultRegisters = {
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

// Mock
class Bus {
  constructor(ram: RAM, programROM: ROM) {
    this.ram = ram;
    this.programROM = programROM;
  }

  // for mock
  set ROM(rom: ROM) {
    this.programROM = rom;
  }

  readByCpu(addr: Word): Byte {
    if (addr >= 0x8000) {
      return this.programROM.read(addr - 0x8000);
    }
    return this.ram.read(addr);
  }

  writeByCpu(addr: Word, data: Byte) {
    this.ram.write(addr, data);
  }
}

let cpu;
let bus;
let mockedROM;
let mockedMemory;
let mockedIntterrupts = {
  isNmiAssert: false,
  deassertNmi: () => { },
};

test.beforeEach(() => {
  mockedMemory = new RAM(0x10000);
  bus = new Bus(mockedMemory);
  cpu = new CPU(bus, mockedIntterrupts);
  cpu.registers.PC = 0x8000;
});

test('LDA_IMM', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_IMM, 0xAA]));
  bus.ROM = mockedROM;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    A: 0xAA,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('LDA_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xA5, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    A: 0xAA,
  };
  t.is(cycle, 3);
  t.deepEqual(cpu.registers, expected);
});

test('LDA_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_ZEROX, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  mockedMemory.write(0xAA, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    A: 0xAA,
    X: 0x05,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDA_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  mockedMemory.write(0x10A5, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8003,
    A: 0xAA,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDA_ABSX', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  mockedMemory.write(0x10AA, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8003,
    A: 0xAA,
    X: 0x05,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDA_ABSY', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_ABSY, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0x05;
  mockedMemory.write(0x10AA, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8003,
    A: 0xAA,
    Y: 0x05,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDA_INDX', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_INDX, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  mockedMemory.write(0xAA, 0xA0);
  mockedMemory.write(0xA0, 0xDE);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    A: 0xDE,
    X: 0x05,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
});

test('LDA_INDY', t => {
  mockedROM = new ROM(new Uint8Array([op.LDA_INDY, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0x05;
  mockedMemory.write(0xA5, 0xA0);
  mockedMemory.write(0xA6, 0x10);
  mockedMemory.write(0x10A5, 0xDE);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    A: 0xDE,
    Y: 0x05,
  };
  t.is(cycle, 5);
  t.deepEqual(cpu.registers, expected);
});

test('LDX_IMM', t => {
  mockedROM = new ROM(new Uint8Array([op.LDX_IMM, 0xAA]));
  bus.ROM = mockedROM;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    X: 0xAA,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('LDX_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.LDX_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xA5, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    X: 0xAA,
  };
  t.is(cycle, 3);
  t.deepEqual(cpu.registers, expected);
});

test('LDX_ZEROY', t => {
  mockedROM = new ROM(new Uint8Array([op.LDX_ZEROY, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0x05;
  mockedMemory.write(0xAA, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    X: 0xAA,
    Y: 0x05,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDX_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.LDX_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  mockedMemory.write(0x10A5, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8003,
    X: 0xAA,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDX_ABSY', t => {
  mockedROM = new ROM(new Uint8Array([op.LDX_ABSY, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0x05;
  mockedMemory.write(0x10AA, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8003,
    X: 0xAA,
    Y: 0x05,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDY_IMM', t => {
  mockedROM = new ROM(new Uint8Array([op.LDY_IMM, 0xAA]));
  bus.ROM = mockedROM;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    Y: 0xAA,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('LDY_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.LDY_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xA5, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    Y: 0xAA,
  };
  t.is(cycle, 3);
  t.deepEqual(cpu.registers, expected);
});

test('LDY_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.LDY_ZEROX, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  mockedMemory.write(0xAA, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8002,
    Y: 0xAA,
    X: 0x05,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDY_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.LDY_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  mockedMemory.write(0x10A5, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8003,
    Y: 0xAA,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('LDY_ABSX', t => {
  mockedROM = new ROM(new Uint8Array([op.LDY_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  mockedMemory.write(0x10AA, 0xAA);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true },
    PC: 0x8003,
    Y: 0xAA,
    X: 0x05,
  };
  t.is(cycle, 4);
  t.deepEqual(cpu.registers, expected);
});

test('STA_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_ZERO, 0xDE]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0xDE);
  t.is(cycle, 3);
  t.deepEqual(data, 0xA5);
});

test('STA_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_ZEROX, 0xA0]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  cpu.registers.A = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0xA5);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('STA_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0x10A5);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('STA_ABSX without page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  cpu.registers.A = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0x10AA);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('STA_ABSX with page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x65;
  cpu.registers.A = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0x110A);
  t.is(cycle, 5);
  t.deepEqual(data, 0xA5);
});

test('STA_ABSY without page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_ABSY, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0x05;
  cpu.registers.A = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0x10AA);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('STA_ABSY with page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_ABSY, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0x65;
  cpu.registers.A = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0x110A);
  t.is(cycle, 5);
  t.deepEqual(data, 0xA5);
});

test('STA_INDX', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_INDX, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xA5;
  cpu.registers.X = 0x05;
  mockedMemory.write(0xAA, 0xDE);
  mockedMemory.write(0xAB, 0x10);
  const cycle = cpu.run();
  const data = mockedMemory.read(0x10DE);
  t.is(cycle, 7);
  t.deepEqual(data, 0xA5);
});

test('STA_INDY without page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_INDY, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xA5;
  cpu.registers.Y = 0x05;
  mockedMemory.write(0xA5, 0xDE);
  mockedMemory.write(0xA6, 0x10);
  const cycle = cpu.run();
  const data = mockedMemory.read(0x10E3);
  t.is(cycle, 6);
  t.deepEqual(data, 0xA5);
});

test('STA_INDY with page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.STA_INDY, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xA5;
  cpu.registers.Y = 0x25;
  mockedMemory.write(0xA5, 0xDE);
  mockedMemory.write(0xA6, 0x10);
  const cycle = cpu.run();
  const data = mockedMemory.read(0x1103);
  t.is(cycle, 7);
  t.deepEqual(data, 0xA5);
});

test('STX_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.STX_ZERO, 0xDE]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0xDE);
  t.is(cycle, 3);
  t.deepEqual(data, 0xA5);
});

test('STX_ZEROY', t => {
  mockedROM = new ROM(new Uint8Array([op.STX_ZEROY, 0xA0]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0xA5;
  cpu.registers.Y = 0x05;
  const cycle = cpu.run();
  const data = mockedMemory.read(0xA5);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('STX_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.STX_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0x10A5);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('STY_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.STY_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0xA5);
  t.is(cycle, 3);
  t.deepEqual(data, 0xA5);
});

test('STY_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.STY_ZEROX, 0xA0]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  cpu.registers.Y = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0xA5);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('STY_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.STY_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.Y = 0xA5;
  const cycle = cpu.run();
  const data = mockedMemory.read(0x10A5);
  t.is(cycle, 4);
  t.deepEqual(data, 0xA5);
});

test('SEI', t => {
  mockedROM = new ROM(new Uint8Array([op.SEI]));
  bus.ROM = mockedROM;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, interrupt: true },
    PC: 0x8001,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('CLI', t => {
  mockedROM = new ROM(new Uint8Array([op.CLI]));
  bus.ROM = mockedROM;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, interrupt: false },
    PC: 0x8001,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('LSR', t => {
  mockedROM = new ROM(new Uint8Array([op.LSR]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xa5;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, carry: true },
    PC: 0x8001,
    A: 0x52,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('LSR_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.LSR_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xA5, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, carry: true },
    PC: 0x8002,
  };
  t.is(cycle, 5);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xA5), 0x77);
});

test('LSR_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.LSR_ZEROX, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xAA, 0xEF);
  cpu.registers.X = 0x05;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    X: 0x05,
    P: { ...defaultRegisters.P, carry: true },
    PC: 0x8002,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xAA), 0x77);
});

test('LSR_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.LSR_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  mockedMemory.write(0x10A5, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, carry: true },
    PC: 0x8003,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10A5), 0x77);
});

test('LSR_ABSX without page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.LSR_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  mockedMemory.write(0x10AA, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, carry: true },
    PC: 0x8003,
    X: 0x05,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10AA), 0x77);
});

test('LSR_ABSX with page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.LSR_ABSX, 0x01, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0xFF;
  mockedMemory.write(0x1100, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, carry: true },
    PC: 0x8003,
    X: 0xFF,
  };
  t.is(cycle, 7);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x1100), 0x77);
});

test('ASL', t => {
  mockedROM = new ROM(new Uint8Array([op.ASL]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xa5;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, carry: true },
    PC: 0x8001,
    A: 0x4A,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('ASL_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.ASL_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xA5, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, carry: true, negative: true },
    PC: 0x8002,
  };
  t.is(cycle, 5);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xA5), 0xDE);
});

test('ASL_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.ASL_ZEROX, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xAA, 0xEF);
  cpu.registers.X = 0x05;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    X: 0x05,
    P: { ...defaultRegisters.P, negative: true, carry: true },
    PC: 0x8002,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xAA), 0xDE);
});

test('ASL_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.ASL_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  mockedMemory.write(0x10A5, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true, carry: true },
    PC: 0x8003,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10A5), 0xDE);
});

test('ASL_ABSX without page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.ASL_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0x05;
  mockedMemory.write(0x10AA, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true, carry: true },
    PC: 0x8003,
    X: 0x05,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10AA), 0xDE);
});

test('ASL_ABSX with page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.ASL_ABSX, 0x01, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.X = 0xFF;
  mockedMemory.write(0x1100, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true, carry: true },
    PC: 0x8003,
    X: 0xFF,
  };
  t.is(cycle, 7);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x1100), 0xDE);
});

test('ROR', t => {
  mockedROM = new ROM(new Uint8Array([op.ROR]));
  bus.ROM = mockedROM;
  cpu.registers.A = 0xa5;
  cpu.registers.P.carry = true;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: true, carry: true  },
    PC: 0x8001,
    A: 0xD2,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('ROR_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.ROR_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xA5, 0xEF);
  cpu.registers.P.carry = true;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8002,
  };
  t.is(cycle, 5);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xA5), 0xF7);
});

test('ROR_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.ROR_ZEROX, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xAA, 0xEF);
  cpu.registers.P.carry = true;
  cpu.registers.X = 0x05;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    X: 0x05,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8002,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xAA), 0xF7);
});

test('ROR_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.ROR_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  mockedMemory.write(0x10A5, 0xEF);
  cpu.registers.P.carry = true;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8003,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10A5), 0xF7);
});

test('ROR_ABSX without page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.ROR_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.P.carry = true;
  cpu.registers.X = 0x05;
  mockedMemory.write(0x10AA, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8003,
    X: 0x05,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10AA), 0xF7);
});

test('ROR_ABSX with page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.ROR_ABSX, 0x01, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.P.carry = true;
  cpu.registers.X = 0xFF;
  mockedMemory.write(0x1100, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8003,
    X: 0xFF,
  };
  t.is(cycle, 7);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x1100), 0xF7);
});

test('ROL', t => {
  mockedROM = new ROM(new Uint8Array([op.ROL]));
  bus.ROM = mockedROM;
  cpu.registers.P.carry = true;
  cpu.registers.A = 0xa5;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, negative: false, carry: true  },
    PC: 0x8001,
    A: 0x4B,
  };
  t.is(cycle, 2);
  t.deepEqual(cpu.registers, expected);
});

test('ROL_ZERO', t => {
  mockedROM = new ROM(new Uint8Array([op.ROL_ZERO, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xA5, 0xEF);
  cpu.registers.P.carry = true;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8002,
  };
  t.is(cycle, 5);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xA5), 0xDF);
});

test('ROL_ZEROX', t => {
  mockedROM = new ROM(new Uint8Array([op.ROL_ZEROX, 0xA5]));
  bus.ROM = mockedROM;
  mockedMemory.write(0xAA, 0xEF);
  cpu.registers.P.carry = true;
  cpu.registers.X = 0x05;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    X: 0x05,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8002,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0xAA), 0xDF);
});

test('ROL_ABS', t => {
  mockedROM = new ROM(new Uint8Array([op.ROL_ABS, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  mockedMemory.write(0x10A5, 0xEF);
  cpu.registers.P.carry = true;
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8003,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10A5), 0xDF);
});

test('ROL_ABSX without page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.ROL_ABSX, 0xA5, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.P.carry = true;
  cpu.registers.X = 0x05;
  mockedMemory.write(0x10AA, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8003,
    X: 0x05,
  };
  t.is(cycle, 6);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x10AA), 0xDF);
});

test('ROL_ABSX with page cross', t => {
  mockedROM = new ROM(new Uint8Array([op.ROL_ABSX, 0x01, 0x10]));
  bus.ROM = mockedROM;
  cpu.registers.P.carry = true;
  cpu.registers.X = 0xFF;
  mockedMemory.write(0x1100, 0xEF);
  const cycle = cpu.run();
  const expected = {
    ...defaultRegisters,
    P: { ...defaultRegisters.P, zero: false, negative: true, carry: true  },
    PC: 0x8003,
    X: 0xFF,
  };
  t.is(cycle, 7);
  t.deepEqual(cpu.registers, expected);
  t.is(mockedMemory.read(0x1100), 0xDF);
});
