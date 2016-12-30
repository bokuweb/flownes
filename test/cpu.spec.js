import 'babel-polyfill';
// import { spy } from 'sinon';
import assert from 'power-assert';
import EventEmitter from 'events';
import CPU, { defaultRegistors } from '../src/cpu';
import * as op from '../src/cpu/opcode';

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
      };
      assert.equal(cycle, 2);
      assert.deepEqual(cpu.registors, expected);
    });
  });
});
