import 'babel-polyfill';
// import { spy } from 'sinon';
import assert from 'power-assert';
import EventEmitter from 'events';
import CPU from '../src/cpu';
import RAM from '../src/ram';
import * as op from '../src/cpu/opcode';

const defaultRegistors = {
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

describe ('cpu spec', () => {
  describe ('instructions', () => {
    let cpu;
    let emitter;
    let mockedROM;
    let mockedMemory;

    beforeEach(() => {
      emitter = new EventEmitter();
      cpu = new CPU(emitter);
      mockedMemory = new RAM(0x10000);
      emitter.on('cpu:read', () => {
        emitter.emit('cpu:read-response', mockedROM);
      });
      emitter.on('cpu:write', ([addr, data]) => {
        console.log(addr);
        for (let i = 0; i < data.length; i++) {
          mockedMemory[addr + i] = data[i];
        }
      });
    });

    it('SEI', async () => {
      mockedROM = new Uint8Array([op.SEI]);
      const cycle = await cpu.exec();
      const expected = {
        ...defaultRegistors,
        P: { ...defaultRegistors.P, interupt: true },
        PC: 0x01,
      };
      assert.equal(cycle, 2);
      assert.deepEqual(cpu.registors, expected);
    });

    it('CLI', async () => {
      mockedROM = new Uint8Array([op.CLI]);
      const cycle = await cpu.exec();
      const expected = {
        ...defaultRegistors,
        P: { ...defaultRegistors.P, interupt: false },
        PC: 0x01,
      };
      assert.equal(cycle, 2);
      assert.deepEqual(cpu.registors, expected);
    });

    describe ('LSR', () => {
      it('LSR', async () => {
        mockedROM = new Uint8Array([op.LSR]);
        cpu.registors.A = 0xa5;
        const cycle = await cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true },
          PC: 0x01,
          A: 0x52,
        };
        assert.equal(cycle, 2);
        assert.deepEqual(cpu.registors, expected);
      });

      it('LSR_ZERO', async () => {
        mockedROM = new Uint8Array([op.LSR_ZERO, 0xA5]);
        mockedMemory[0xA5] = 0xDE;
        const cycle = await cpu.exec();
        const expected = {
          ...defaultRegistors,
          P: { ...defaultRegistors.P, carry: true },
          PC: 0x02,
        };
        assert.equal(cycle, 5);
        assert.deepEqual(cpu.registors, expected);
      });
    });
  });
});
