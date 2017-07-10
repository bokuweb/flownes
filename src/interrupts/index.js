/* @flow */

export default class Interrupts {

  nmi: boolean;
  irq: boolean;

  constructor() {
    this.nmi = false;
  }

  get isNmiAssert(): boolean {
    return this.nmi;
  }

  get isIrqAssert(): boolean {
    return this.irq;
  }

  assertNmi() {
    this.nmi = true;
  }

  deassertNmi() {
    this.nmi = false;
  }

  assertIrq() {
    this.irq = true;
  }  

  deassertIrq() {
    this.irq = false;
  }  
}