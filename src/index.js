/* @flow */

import { NES } from './nes';

fetch('./static/roms/nestest.nes')
    .then((res) => res.arrayBuffer())
    .then((nesFile: ArrayBuffer) => {
        const nes = new NES();
        nes.load(nesFile);
        nes.start();
    });
