/* @flow */

import 'babel-polyfill';
import { NES } from './nes';

(async () => {
  const nes = new NES();
  await nes.setup();
})();
