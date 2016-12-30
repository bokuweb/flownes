/* @flow */

export interface OpecodeProps {
  fullName: string;
  baseName: string;
  mode: AddressingMode;
  cycle: number;
}

export type AddressingMode =
  'zeroPage'            |
  'relative'            |
  'implied'             |
  'absolute'            |
  'accumulator'         |
  'immediate'           |
  'zeroPageX'           |
  'zeroPageY'           |
  'absoluteX'           |
  'absoluteY'           |
  'preIndexedIndirect'  |
  'postIndexedIndirect' |
  'indirectAbsolute';


/* eslint-disable */
export const
/*
 *
 *  NONE            IMM             ZERO             ABS             ZEROX              ZEROY             ABSX             ABSY             INDX             INDY
 *
 */
                    LDA_IMM = 0xA9, LDA_ZERO = 0xA5, LDA_ABS = 0xAD, LDA_ZEROX = 0xB5,                    LDA_ABSX = 0xBD, LDA_ABSY = 0xB9, LDA_INDX = 0xA1, LDA_INDY = 0xB1,
                    LDX_IMM = 0xA2, LDX_ZERO = 0xA6, LDX_ABS = 0xAE,                    LDX_ZEROY = 0xB6,                  LDX_ABSY = 0xBE,
                    LDY_IMM = 0xA0, LDY_ZERO = 0xA4, LDY_ABS = 0xAC, LDY_ZEROX = 0xB4,                    LDY_ABSX = 0xBC,

                                    STA_ZERO = 0x85, STA_ABS = 0x8D, STA_ZEROX = 0x95,                    STA_ABSX = 0x9D, STA_ABSY = 0x99, STA_INDX = 0x81, STA_INDY = 0x91,
                                    STX_ZERO = 0x86, STX_ABS = 0x8E,                    STX_ZEROY = 0x96,
                                    STY_ZERO = 0x84, STY_ABS = 0x8C, STY_ZEROX = 0x94,

    TXA = 0x8A,
    TYA = 0x98,
    TXS = 0x9A,
    TAY = 0xA8,
    TAX = 0xAA,
    TSX = 0xBA,

    PHP = 0x08,
    PLP = 0x28,
    PHA = 0x48,
    PLA = 0x68,

                   ADC_IMM = 0x69,  ADC_ZERO = 0x65, ADC_ABS = 0x6D, ADC_ZEROX = 0x75,                    ADC_ABSX = 0x7D, ADC_ABSY = 0x79, ADC_INDX = 0x61, ADC_INDY = 0x71,
                   SBC_IMM = 0xE9,  SBC_ZERO = 0xE5, SBC_ABS = 0xED, SBC_ZEROX = 0xF5,                    SBC_ABSX = 0xFD, SBC_ABSY = 0xF9, SBC_INDX = 0xE1, SBC_INDY = 0xF1,
                   CPX_IMM = 0xE0,  CPX_ZERO = 0xE4, CPX_ABS = 0xEC,
                   CPY_IMM = 0xC0,  CPY_ZERO = 0xC4, CPY_ABS = 0xCC,
                   CMP_IMM = 0xC9,  CMP_ZERO = 0xC5, CMP_ABS = 0xCD, CMP_ZEROX = 0xD5,                    CMP_ABSX = 0xDD, CMP_ABSY = 0xD9, CMP_INDX = 0xC1, CMP_INDY = 0xD1,

                   AND_IMM = 0x29,  AND_ZERO = 0x25, AND_ABS = 0x2D, AND_ZEROX = 0x35,                    AND_ABSX = 0x3D, AND_ABSY = 0x39, AND_INDX = 0x21, AND_INDY = 0x31,
                   EOR_IMM = 0x49,  EOR_ZERO = 0x45, EOR_ABS = 0x4D, EOR_ZEROX = 0x55,                    EOR_ABSX = 0x5D, EOR_ABSY = 0x59, EOR_INDX = 0x41, EOR_INDY = 0x51,
                   ORA_IMM = 0x09,  ORA_ZERO = 0x05, ORA_ABS = 0x0D, ORA_ZEROX = 0x15,                    ORA_ABSX = 0x1D, ORA_ABSY = 0x19, ORA_INDX = 0x01, ORA_INDY = 0x11,
                                    BIT_ZERO = 0x24, BIT_ABS = 0x2C,

    ASL = 0x0A,                     ASL_ZERO = 0x06, ASL_ABS = 0x0E, ASL_ZEROX = 0x16,                    ASL_ABSX = 0x1E,
    LSR = 0x4A,                     LSR_ZERO = 0x46, LSR_ABS = 0x4E, LSR_ZEROX = 0x56,                    LSR_ABSX = 0x5E,
    ROL = 0x2A,                     ROL_ZERO = 0x26, ROL_ABS = 0x2E, ROL_ZEROX = 0x36,                    ROL_ABSX = 0x3E,
    ROR = 0x6A,                     ROR_ZERO = 0x66, ROR_ABS = 0x6E, ROR_ZEROX = 0x76,                    ROR_ABSX = 0x7E,

    INX = 0xE8,
    INY = 0xC8,
                                    INC_ZERO = 0xE6, INC_ABS = 0xEE, INC_ZEROX = 0xF6,                    INC_ABSX = 0xFE,
    DEX = 0xCA,
    DEY = 0x88,
                                    DEC_ZERO = 0xC6, DEC_ABS = 0xCE, DEC_ZEROX = 0xD6,                    DEC_ABSX = 0xDE,

    CLC = 0x18,
    CLI = 0x58,
    CLV = 0xB8,
    /* CLD is unmountED on NES */
    SEC = 0x38,
    SEI = 0x78,
    /* SED is unmountED on NES */

    NOP = 0xEA,
    BRK = 0x00,

                                                     JSR_ABS = 0x20,
                                                     JMP_ABS = 0x4C,
    RTI = 0x40,
    RTS = 0x60,

    BPL = 0x10,
    BMI = 0x30,
    BVC = 0x50,
    BVS = 0x70,
    BCC = 0x90,
    BCS = 0xB0,
    BNE = 0xD0,
    BEQ = 0xF0;

export const cycles = [
  /*0x00*/ 7,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6,
  /*0x10*/ 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
  /*0x20*/ 6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6,
  /*0x30*/ 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
  /*0x40*/ 6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6,
  /*0x50*/ 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
  /*0x60*/ 6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6,
  /*0x70*/ 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
  /*0x80*/ 2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4,
  /*0x90*/ 2,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,
  /*0xA0*/ 2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4,
  /*0xB0*/ 2,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,
  /*0xC0*/ 2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6,
  /*0xD0*/ 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
  /*0xE0*/ 2,6,3,8,3,3,5,5,2,2,2,2,4,4,6,6,
  /*0xF0*/ 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7
];

/* eslint-disable */
export const dict: { [code: string]: OpecodeProps } = {
  'A2': { fullName: 'LDX_IMM',   baseName: 'LDX', mode: 'immediate',           cycle: cycles[0xA2] },
  'A6': { fullName: 'LDX_ZERO',  baseName: 'LDX', mode: 'zeroPage',            cycle: cycles[0xA6] },
  'AE': { fullName: 'LDX_ABS',   baseName: 'LDX', mode: 'absolute',            cycle: cycles[0xAE] },
  'B6': { fullName: 'LDX_ZEROY', baseName: 'LDX', mode: 'zeroPageY',           cycle: cycles[0xB6] },
  'BE': { fullName: 'LDX_ABSY',  baseName: 'LDX', mode: 'absoluteY',           cycle: cycles[0xBE] },
  'A0': { fullName: 'LDY_IMM',   baseName: 'LDY', mode: 'immediate',           cycle: cycles[0xA0] },
  'A4': { fullName: 'LDY_ZERO',  baseName: 'LDY', mode: 'zeroPage',            cycle: cycles[0xA4] },
  'AC': { fullName: 'LDY_ABS',   baseName: 'LDY', mode: 'absolute',            cycle: cycles[0xAC] },
  'B4': { fullName: 'LDY_ZEROX', baseName: 'LDY', mode: 'zeroPageX',           cycle: cycles[0xB4] },
  'BC': { fullName: 'LDY_ABSX',  baseName: 'LDY', mode: 'absoluteX',           cycle: cycles[0xBC] },
  '85': { fullName: 'STA_ZERO',  baseName: 'STA', mode: 'zeroPage',            cycle: cycles[0x85] },
  '8D': { fullName: 'STA_ABS',   baseName: 'STA', mode: 'absolute',            cycle: cycles[0x8D] },
  '95': { fullName: 'STA_ZEROX', baseName: 'STA', mode: 'zeroPage',            cycle: cycles[0x95] },
  '9D': { fullName: 'STA_ABSX',  baseName: 'STA', mode: 'absoluteX',           cycle: cycles[0x9D] },
  '99': { fullName: 'STA_ABSY',  baseName: 'STA', mode: 'absoluteY',           cycle: cycles[0x99] },
  '81': { fullName: 'STA_INDX',  baseName: 'STA', mode: 'preIndexedIndirect',  cycle: cycles[0x81] },
  '91': { fullName: 'STA_INDY',  baseName: 'STA', mode: 'postIndexedIndirect', cycle: cycles[0x91] },
  '86': { fullName: 'STX_ZERO',  baseName: 'STX', mode: 'zeroPage',            cycle: cycles[0x86] },
  '8E': { fullName: 'STX_ABS',   baseName: 'STX', mode: 'absolute',            cycle: cycles[0x8E] },
  '96': { fullName: 'STX_ZEROY', baseName: 'STX', mode: 'zeroPageY',           cycle: cycles[0x96] },
  '84': { fullName: 'STY_ZERO',  baseName: 'STY', mode: 'zeroPage',            cycle: cycles[0x84] },
  '8C': { fullName: 'STY_ABS',   baseName: 'STY', mode: 'absolute',            cycle: cycles[0x8C] },
  '94': { fullName: 'STY_ZEROX', baseName: 'STY', mode: 'zeroPageX',           cycle: cycles[0x94] },
  '8A': { fullName: 'TXA',       baseName: 'TXA', mode: 'implied',             cycle: cycles[0x8A] },
  '98': { fullName: 'TYA',       baseName: 'TYA', mode: 'implied',             cycle: cycles[0x98] },
  '9A': { fullName: 'TXS',       baseName: 'TXS', mode: 'implied',             cycle: cycles[0x9A] },
  'A8': { fullName: 'TAY',       baseName: 'TAY', mode: 'implied',             cycle: cycles[0xA8] },
  'AA': { fullName: 'TAX',       baseName: 'TAX', mode: 'implied',             cycle: cycles[0xAA] },
  'BA': { fullName: 'TSX',       baseName: 'TSX', mode: 'implied',             cycle: cycles[0xBA] },
  '8' : { fullName: 'PHP',       baseName: 'PHP', mode: 'implied',             cycle: cycles[0x08] },
  '28': { fullName: 'PLP',       baseName: 'PLP', mode: 'implied',             cycle: cycles[0x28] },
  '48': { fullName: 'PHA',       baseName: 'PHA', mode: 'implied',             cycle: cycles[0x48] },
  '68': { fullName: 'PLA',       baseName: 'PLA', mode: 'implied',             cycle: cycles[0x68] },
  '69': { fullName: 'ADC_IMM',   baseName: 'ADC', mode: 'immediate',           cycle: cycles[0x69] },
  '65': { fullName: 'ADC_ZERO',  baseName: 'ADC', mode: 'zeroPage',            cycle: cycles[0x65] },
  '6D': { fullName: 'ADC_ABS',   baseName: 'ADC', mode: 'absolute',            cycle: cycles[0x6D] },
  '75': { fullName: 'ADC_ZEROX', baseName: 'ADC', mode: 'zeroPageX',           cycle: cycles[0x75] },
  '7D': { fullName: 'ADC_ABSX',  baseName: 'ADC', mode: 'absoluteX',           cycle: cycles[0x7D] },
  '79': { fullName: 'ADC_ABSY',  baseName: 'ADC', mode: 'absoluteY',           cycle: cycles[0x79] },
  '61': { fullName: 'ADC_INDX',  baseName: 'ADC', mode: 'preIndexedIndirect',  cycle: cycles[0x61] },
  '71': { fullName: 'ADC_INDY',  baseName: 'ADC', mode: 'postIndexedIndirect', cycle: cycles[0x71] },
  'E9': { fullName: 'SBC_IMM',   baseName: 'SBC', mode: 'immediate',           cycle: cycles[0xE9] },
  'E5': { fullName: 'SBC_ZERO',  baseName: 'SBC', mode: 'zeroPage',            cycle: cycles[0xE5] },
  'ED': { fullName: 'SBC_ABS',   baseName: 'SBC', mode: 'absolute',            cycle: cycles[0xED] },
  'F5': { fullName: 'SBC_ZEROX', baseName: 'SBC', mode: 'zeroPageX',           cycle: cycles[0xF5] },
  'FD': { fullName: 'SBC_ABSX',  baseName: 'SBC', mode: 'absoluteX',           cycle: cycles[0xFD] },
  'F9': { fullName: 'SBC_ABSY',  baseName: 'SBC', mode: 'absoluteY',           cycle: cycles[0xF9] },
  'E1': { fullName: 'SBC_INDX',  baseName: 'SBC', mode: 'preIndexedIndirect',  cycle: cycles[0xE1] },
  'F1': { fullName: 'SBC_INDY',  baseName: 'SBC', mode: 'postIndexedIndirect', cycle: cycles[0xF1] },
  'E0': { fullName: 'CPX_IMM',   baseName: 'CPX', mode: 'immediate',           cycle: cycles[0xE0] },
  'E4': { fullName: 'CPX_ZERO',  baseName: 'CPX', mode: 'zeroPage',            cycle: cycles[0xE4] },
  'EC': { fullName: 'CPX_ABS',   baseName: 'CPX', mode: 'absolute',            cycle: cycles[0xEC] },
  'C0': { fullName: 'CPY_IMM',   baseName: 'CPY', mode: 'immediate',           cycle: cycles[0xC0] },
  'C4': { fullName: 'CPY_ZERO',  baseName: 'CPY', mode: 'zeroPage',            cycle: cycles[0xC4] },
  'CC': { fullName: 'CPY_ABS',   baseName: 'CPY', mode: 'absolute',            cycle: cycles[0xCC] },
  'C9': { fullName: 'CMP_IMM',   baseName: 'CMP', mode: 'immediate',           cycle: cycles[0xC9] },
  'C5': { fullName: 'CMP_ZERO',  baseName: 'CMP', mode: 'zeroPage',            cycle: cycles[0xC5] },
  'CD': { fullName: 'CMP_ABS',   baseName: 'CMP', mode: 'absolute',            cycle: cycles[0xCD] },
  'D5': { fullName: 'CMP_ZEROX', baseName: 'CMP', mode: 'zeroPageX',           cycle: cycles[0xD5] },
  'DD': { fullName: 'CMP_ABSX',  baseName: 'CMP', mode: 'absoluteX',           cycle: cycles[0xDD] },
  'D9': { fullName: 'CMP_ABSY',  baseName: 'CMP', mode: 'absoluteY',           cycle: cycles[0xD9] },
  'C1': { fullName: 'CMP_INDX',  baseName: 'CMP', mode: 'preIndexedIndirect',  cycle: cycles[0xC1] },
  'D1': { fullName: 'CMP_INDY',  baseName: 'CMP', mode: 'postIndexedIndirect', cycle: cycles[0xD1] },
  '29': { fullName: 'AND_IMM',   baseName: 'AND', mode: 'immediate',           cycle: cycles[0x29] },
  '25': { fullName: 'AND_ZERO',  baseName: 'AND', mode: 'zeroPage',            cycle: cycles[0x25] },
  '2D': { fullName: 'AND_ABS',   baseName: 'AND', mode: 'absolute',            cycle: cycles[0x2D] },
  '35': { fullName: 'AND_ZEROX', baseName: 'AND', mode: 'zeroPageX',           cycle: cycles[0x35] },
  '3D': { fullName: 'AND_ABSX',  baseName: 'AND', mode: 'absoluteX',           cycle: cycles[0x3D] },
  '39': { fullName: 'AND_ABSY',  baseName: 'AND', mode: 'absoluteY',           cycle: cycles[0x39] },
  '21': { fullName: 'AND_INDX',  baseName: 'AND', mode: 'preIndexedIndirect',  cycle: cycles[0x21] },
  '31': { fullName: 'AND_INDY',  baseName: 'AND', mode: 'postIndexedIndirect', cycle: cycles[0x31] },
  '49': { fullName: 'EOR_IMM',   baseName: 'EOR', mode: 'immediate',           cycle: cycles[0x49] },
  '45': { fullName: 'EOR_ZERO',  baseName: 'EOR', mode: 'zeroPage',            cycle: cycles[0x45] },
  '4D': { fullName: 'EOR_ABS',   baseName: 'EOR', mode: 'absolute',            cycle: cycles[0x4D] },
  '55': { fullName: 'EOR_ZEROX', baseName: 'EOR', mode: 'zeroPageX',           cycle: cycles[0x55] },
  '5D': { fullName: 'EOR_ABSX',  baseName: 'EOR', mode: 'absoluteX',           cycle: cycles[0x5D] },
  '59': { fullName: 'EOR_ABSY',  baseName: 'EOR', mode: 'absoluteY',           cycle: cycles[0x59] },
  '41': { fullName: 'EOR_INDX',  baseName: 'EOR', mode: 'preIndexedIndirect',  cycle: cycles[0x41] },
  '51': { fullName: 'EOR_INDY',  baseName: 'EOR', mode: 'postIndexedIndirect', cycle: cycles[0x51] },
  '9' : { fullName: 'ORA_IMM',   baseName: 'ORA', mode: 'immediate',           cycle: cycles[0x09] },
  '5' : { fullName: 'ORA_ZERO',  baseName: 'ORA', mode: 'zeroPage',            cycle: cycles[0x05] },
  'D' : { fullName: 'ORA_ABS',   baseName: 'ORA', mode: 'absolute',            cycle: cycles[0x0D] },
  '15': { fullName: 'ORA_ZEROX', baseName: 'ORA', mode: 'zeroPageX',           cycle: cycles[0x15] },
  '1D': { fullName: 'ORA_ABSX',  baseName: 'ORA', mode: 'absoluteX',           cycle: cycles[0x1D] },
  '19': { fullName: 'ORA_ABSY',  baseName: 'ORA', mode: 'absoluteY',           cycle: cycles[0x19] },
  '1' : { fullName: 'ORA_INDX',  baseName: 'ORA', mode: 'preIndexedIndirect',  cycle: cycles[0x01] },
  '11': { fullName: 'ORA_INDY',  baseName: 'ORA', mode: 'postIndexedIndirect', cycle: cycles[0x11] },
  '24': { fullName: 'BIT_ZERO',  baseName: 'BIT', mode: 'zeroPage',            cycle: cycles[0x24] },
  '2C': { fullName: 'BIT_ABS',   baseName: 'BIT', mode: 'absolute',            cycle: cycles[0x2C] },
  'A' : { fullName: 'ASL',       baseName: 'ASL', mode: 'accumulator',         cycle: cycles[0x0A] },
  '6' : { fullName: 'ASL_ZERO',  baseName: 'ASL', mode: 'zeroPage',            cycle: cycles[0x06] },
  'E' : { fullName: 'ASL_ABS',   baseName: 'ASL', mode: 'absolute',            cycle: cycles[0x0E] },
  '16': { fullName: 'ASL_ZEROX', baseName: 'ASL', mode: 'zeroPageX',           cycle: cycles[0x16] },
  '1E': { fullName: 'ASL_ABSX',  baseName: 'ASL', mode: 'absoluteX',           cycle: cycles[0x1E] },
  '4A': { fullName: 'LSR',       baseName: 'LSR', mode: 'accumulator',         cycle: cycles[0x4A] },
  '46': { fullName: 'LSR_ZERO',  baseName: 'LSR', mode: 'zeroPage',            cycle: cycles[0x46] },
  '4E': { fullName: 'LSR_ABS',   baseName: 'LSR', mode: 'absolute',            cycle: cycles[0x4E] },
  '56': { fullName: 'LSR_ZEROX', baseName: 'LSR', mode: 'zeroPageX',           cycle: cycles[0x56] },
  '5E': { fullName: 'LSR_ABSX',  baseName: 'LSR', mode: 'absoluteX',           cycle: cycles[0x5E] },
  '2A': { fullName: 'ROL',       baseName: 'ROL', mode: 'accumulator',         cycle: cycles[0x2A] },
  '26': { fullName: 'ROL_ZERO',  baseName: 'ROL', mode: 'zeroPage',            cycle: cycles[0x26] },
  '2E': { fullName: 'ROL_ABS',   baseName: 'ROL', mode: 'absolute',            cycle: cycles[0x2E] },
  '36': { fullName: 'ROL_ZEROX', baseName: 'ROL', mode: 'zeroPageX',           cycle: cycles[0x36] },
  '3E': { fullName: 'ROL_ABSX',  baseName: 'ROL', mode: 'absoluteX',           cycle: cycles[0x3E] },
  '6A': { fullName: 'ROR',       baseName: 'ROR', mode: 'accumulator',         cycle: cycles[0x6A] },
  '66': { fullName: 'ROR_ZERO',  baseName: 'ROR', mode: 'zeroPage',            cycle: cycles[0x66] },
  '6E': { fullName: 'ROR_ABS',   baseName: 'ROR', mode: 'absolute',            cycle: cycles[0x6E] },
  '76': { fullName: 'ROR_ZEROX', baseName: 'ROR', mode: 'zeroPageX',           cycle: cycles[0x76] },
  '7E': { fullName: 'ROR_ABSX',  baseName: 'ROR', mode: 'absoluteX',           cycle: cycles[0x7E] },
  'E8': { fullName: 'INX',       baseName: 'INX', mode: 'implied',             cycle: cycles[0xE8] },
  'C8': { fullName: 'INY',       baseName: 'INY', mode: 'implied',             cycle: cycles[0xC8] },
  'E6': { fullName: 'INC_ZERO',  baseName: 'INC', mode: 'zeroPage',            cycle: cycles[0xE6] },
  'EE': { fullName: 'INC_ABS',   baseName: 'INC', mode: 'absolute',            cycle: cycles[0xEE] },
  'F6': { fullName: 'INC_ZEROX', baseName: 'INC', mode: 'zeroPageX',           cycle: cycles[0xF6] },
  'FE': { fullName: 'INC_ABSX',  baseName: 'INC', mode: 'absoluteX',           cycle: cycles[0xFE] },
  'CA': { fullName: 'DEX',       baseName: 'DEX', mode: 'implied',             cycle: cycles[0xCA] },
  '88': { fullName: 'DEY',       baseName: 'DEY', mode: 'implied',             cycle: cycles[0x88] },
  'C6': { fullName: 'DEC_ZERO',  baseName: 'DEC', mode: 'zeroPage',            cycle: cycles[0xC6] },
  'CE': { fullName: 'DEC_ABS',   baseName: 'DEC', mode: 'absolute',            cycle: cycles[0xCE] },
  'D6': { fullName: 'DEC_ZEROX', baseName: 'DEC', mode: 'zeroPageX',           cycle: cycles[0xD6] },
  'DE': { fullName: 'DEC_ABSX',  baseName: 'DEC', mode: 'absoluteX',           cycle: cycles[0xDE] },
  '18': { fullName: 'CLC',       baseName: 'CLC', mode: 'implied',             cycle: cycles[0x18] },
  '58': { fullName: 'CLI',       baseName: 'CLI', mode: 'implied',             cycle: cycles[0x58] },
  'B8': { fullName: 'CLV',       baseName: 'CLV', mode: 'implied',             cycle: cycles[0xB8] },
  '38': { fullName: 'SEC',       baseName: 'SEC', mode: 'implied',             cycle: cycles[0x38] },
  '78': { fullName: 'SEI',       baseName: 'SEI', mode: 'implied',             cycle: cycles[0x78] },
  'EA': { fullName: 'NOP',       baseName: 'NOP', mode: 'implied',             cycle: cycles[0xEA] },
  '0' : { fullName: 'BRK',       baseName: 'BRK', mode: 'implied',             cycle: cycles[0x00] },
  '20': { fullName: 'JSR_ABS',   baseName: 'JSR', mode: 'absolute',            cycle: cycles[0x20] },
  '4C': { fullName: 'JMP_ABS',   baseName: 'JMP', mode: 'absolute',            cycle: cycles[0x4C] },
  '40': { fullName: 'RTI',       baseName: 'RTI', mode: 'implied',             cycle: cycles[0x40] },
  '60': { fullName: 'RTS',       baseName: 'RTS', mode: 'implied',             cycle: cycles[0x60] },
  '10': { fullName: 'BPL',       baseName: 'BPL', mode: 'relative',            cycle: cycles[0x10] },
  '30': { fullName: 'BMI',       baseName: 'BMI', mode: 'relative',            cycle: cycles[0x30] },
  '50': { fullName: 'BVC',       baseName: 'BVC', mode: 'relative',            cycle: cycles[0x50] },
  '70': { fullName: 'BVS',       baseName: 'BVS', mode: 'relative',            cycle: cycles[0x70] },
  '90': { fullName: 'BCC',       baseName: 'BCC', mode: 'relative',            cycle: cycles[0x90] },
  'B0': { fullName: 'BCS',       baseName: 'BCS', mode: 'relative',            cycle: cycles[0xB0] },
  'D0': { fullName: 'BNE',       baseName: 'BNE', mode: 'relative',            cycle: cycles[0xD0] },
  'F0': { fullName: 'BEQ',       baseName: 'BEQ', mode: 'relative',            cycle: cycles[0xF0] },
};
