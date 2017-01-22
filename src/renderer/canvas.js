/* @flow */

import type { Sprite } from '../ppu';


export default class CanvasRenderer {

  ctx: ?CanvasRenderingContext2D;

  constructor(elementName: string) {
    const canvas = ((document.getElementById(elementName): any): HTMLCanvasElement);
    this.ctx = canvas.getContext('2d');
  }

  renderSprites(sprites: Array<Sprite>) {
    if (!this.ctx) return;
    for (let i = 0; i < sprites.length; i++) {
      this.renderSprite(sprites[i], i);
    }
  }

  renderSprite(sprite: Sprite, tileNumber: number) {
    if (!this.ctx) return;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        this.ctx.fillStyle = `rgb(${85 * sprite[i][j]}, ${85 * sprite[i][j]}, ${85 * sprite[i][j]})`;
        const x = (j + (tileNumber % 32) * 8);
        const y = (i + ~~(tileNumber / 32) * 8);
        this.ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}