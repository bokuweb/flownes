/* @flow */

type Registors = {
  A: number;
  X: number;
  Y: number;
  S: number;
  P: number;
  PC: number;
};

export class Cpu {

  registors: Registors;

  constructor() {
    this.registors = {
      A: 0,
      X: 0,
      Y: 0,
      S: 0xFD,
      P: 0x34,
      PC: 0x8000,
    };
  }
}
