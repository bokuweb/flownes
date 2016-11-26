/* @flow */

import { parse } from '../parser';
import EventEmitter from 'events';
import CPU from '../cpu';
import ROM from '../rom';
import log from '../helper/log';

export type Dispatch = (event: string, params: Array<any>) => {};

export class NES {
  cpu: CPU;
  charactorROM: ROM;
  programROM: ROM;
  emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  subscribe(events: Object) {
    Object.keys(events).forEach(name => {
      const handler = events[name];
      this.emitter.on(name, handler.bind(this));
    });
  }

  cpuRead([addr, size]: [number, number]) {
    log.debug(`cpu:read addr = ${addr}`, `size = ${size}`);
    let data: number[] = [];
    if (addr >= 0x8000) {
      data = this.programROM.read(addr - 0x8000, size);
    }
    this.emitter.emit('cpu:read-response', data);
  }

  async setup() {
    const nes = await fetch('./static/roms/hello.nes').then((res) => res.arrayBuffer());
    const { charactorROM, programROM } = parse(nes);
    this.charactorROM = new ROM(charactorROM);
    this.programROM = new ROM(programROM);
    this.subscribe({
      'cpu:read': this.cpuRead.bind(this),
    });
    this.cpu = new CPU(this.emitter);
    await this.cpu.reset();
    await this.cpu.exec();
  }
}
