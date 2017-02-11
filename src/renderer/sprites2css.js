/* @flow */

import type { Sprite } from '../ppu';

export function sprites2Css(sprites: Array<Sprite>): string {
  let boxShadow = "";
  for (let i = 0; i < sprites.length; i++) {
    boxShadow += renderSprite(sprites[i], i);
  }
  return boxShadow;
}

function renderSprite(sprite: Sprite, tileNumber: number): string {
  let s = "";
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const x = (j + (tileNumber % 32) * 8);
      const y = (i + ~~(tileNumber / 32) * 8);
      const color = sprite[i][j] * 85;
      if (x === 255 && y === 239) {
        s +=`${x}px ${y}px rgb(${color},${color},${color})`;
      } else {
        s += `${x}px ${y}px rgb(${color},${color},${color}), `;
      }
    }
  }
  return s;
}