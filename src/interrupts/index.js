/* @flow */

export default class Interrupts {

  nmi: boolean;

  constructor() {
    this.nmi = false;
  }

  get isNmiAssert(): boolean {
    return this.nmi;
  }

  assertNmi() {
    this.nmi = true;
  }

  deassertNmi() {
    this.nmi = false;
  }
}