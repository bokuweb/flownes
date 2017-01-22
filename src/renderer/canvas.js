/* @flow */

import type { Sprite } from '../ppu';

export default class CanvasRenderer {

  ctx: ?CanvasRenderingContext2D;
  image: any;

  constructor(elementName: string) {
    const canvas = ((document.getElementById(elementName): any): HTMLCanvasElement);
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.image = this.ctx.createImageData(256, 240);
    }
  }

  renderSprites(sprites: Array<Sprite>) {
    if (!this.ctx) return;
    for (let i = 0; i < sprites.length; i++) {
      this.renderSprite(sprites[i], i);
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  renderSprite(sprite: Sprite, tileNumber: number) {
    if (!this.ctx) return;
    const { data } = this.image;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const x = (j + (tileNumber % 32) * 8);
        const y = (i + ~~(tileNumber / 32) * 8);
        const color = sprite[i][j] * 85;
        const index = (x + y * 256) * 4;
        data[index] = color;
        data[index + 1] = color;
        data[index + 2] = color;
        data[index + 3] = 0xFF;
      }
    }
  }
}
