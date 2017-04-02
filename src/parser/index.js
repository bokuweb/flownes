/* @flow */
const NES_HEADER_SIZE = 0x0010;
const PROGRAM_ROM_SIZE = 0x4000;
const CHARACTER_ROM_SIZE = 0x2000;

export type NesROM = {
  isHorizontalMirror: boolean;
  characterROM: Uint8Array;
  programROM: Uint8Array;
};

export const parse = (nesBuffer: ArrayBuffer): NesROM => {
  const nes = new Uint8Array(nesBuffer);
  if ([].slice.call(nes, 0, 3).map(v => String.fromCharCode(v)).join('') !== 'NES') {
    throw new Error('this file is not an NES format.');
  }
  const programROMPages = nes[4];
  const characterROMPages = nes[5];
  const isHorizontalMirror = !(nes[6] & 0x01);
  const characterROMStart = NES_HEADER_SIZE + programROMPages * PROGRAM_ROM_SIZE;
  const characterROMEnd = characterROMStart + characterROMPages * CHARACTER_ROM_SIZE;

  const nesROM = {
    isHorizontalMirror,
    programROM: nes.slice(NES_HEADER_SIZE, characterROMStart - 1),
    characterROM: nes.slice(characterROMStart, characterROMEnd - 1),
  };
  return nesROM;
};

