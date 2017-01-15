/* @flow */

// flow-disable-line
// import 'babel-polyfill';
import { NES } from './nes';

//(async () => {
const nes = new NES();
nes.setup().then(() => nes.start());
