/* @flow */

import { NES } from './nes';

const nes = new NES();
nes.setup().then(() => nes.start());
