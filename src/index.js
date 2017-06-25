/* @flow */

import { NES } from './nes';

fetch('./static/roms/color-bars-mapper0.nes')
    .then((res) => res.arrayBuffer())
    .then((nesFile: ArrayBuffer) => {
        const nes = new NES();
        nes.setup(nesFile);
        nes.start();
    });
