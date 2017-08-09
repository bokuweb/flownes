/* @flow */

import Ram from '../ram';
import Ppu from '../ppu';
import type { Byte } from '../types/common';

export default class Dma {

  isProcessing: boolean;
  ramAddr: Byte;
  ram: Ram;
  ppu: Ppu;
  addr: Byte;
  cycle: number;

  constructor(ram: Ram, ppu: Ppu) {
    this.isProcessing = false;
    this.ramAddr = 0x0000;
    this.ram = ram;
    this.ppu = ppu;
  }

  get isDmaProcessing(): boolean {
    return this.isProcessing;
  }

  runDma() {
    if (!this.isProcessing) return;
    for (let i = 0; i < 0x100; i = (i + 1) | 0) {
      this.ppu.transferSprite(i, this.ram.read(this.ramAddr + i));
    }
    this.isProcessing = false;
  }

  write(data: Byte) {
    console.log('dma', data)
    debugger;
    this.ramAddr = data << 8;
    this.isProcessing = true;
  }
}