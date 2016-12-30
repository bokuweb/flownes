import 'babel-polyfill';
// import { spy } from 'sinon';
import assert from 'power-assert';
import EventEmitter from 'events';
import CPU from '../src/cpu';
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
    let mockROM;

    beforeEach(() => {
      emitter = new EventEmitter();
      cpu = new CPU(emitter);
      emitter.on('cpu:read', () => {
        emitter.emit('cpu:read-response', mockROM);
      });
    });

    it('SEI', async () => {
      mockROM = new Uint8Array([op.SEI]);
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
      mockROM = new Uint8Array([op.CLI]);
      const cycle = await cpu.exec();
      const expected = {
        ...defaultRegistors,
        P: { ...defaultRegistors.P, interupt: false },
        PC: 0x01,
      };
      assert.equal(cycle, 2);
      assert.deepEqual(cpu.registors, expected);
    });

    it('LSR', async () => {
      mockROM = new Uint8Array([op.LSR]);
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
  });
});
