/* @flow */
import log from '../helper/log';

const NES_HEADER_SIZE = 0x0010;
const PROGRAM_ROM_SIZE = 0x4000;
const CHARACTOR_ROM_SIZE = 0x2000;

export type NesROM = {
  charactorROM: Uint8Array;
  programROM: Uint8Array;
};

export const parse = (nesBuffer: ArrayBuffer): NesROM => {
  log.debug('parsing...');
  const nes = new Uint8Array(nesBuffer);
  if ([].slice.call(nes, 0, 3).map(v => String.fromCharCode(v)).join('') !== 'NES') {
    throw new Error('this file is not an NES format.');
  }
  const programROMPages = nes[4];
  const charactorROMPages = nes[5];
  const charactorROMStart = NES_HEADER_SIZE + programROMPages * PROGRAM_ROM_SIZE;
  const charactorROMEnd = charactorROMStart + charactorROMPages * CHARACTOR_ROM_SIZE;

  const nesROM = {
    programROM: nes.slice(NES_HEADER_SIZE, charactorROMStart - 1),
    charactorROM: nes.slice(charactorROMStart, charactorROMEnd - 1),
  };
  log.debug('---- nes rom data -----');
  log.debug(nesROM);

  return nesROM;
};

