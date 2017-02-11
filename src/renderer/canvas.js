/* @flow */

import type { Sprite, SpriteWithAttribute, Background, Pallete } from '../ppu';
import { colors } from './colors';
// import { imageData2Css } from './image-data2css';

export default class CanvasRenderer {

  ctx: ?CanvasRenderingContext2D;
  image: any;

  constructor(elementName: string) {
    const canvas = ((document.getElementById(elementName): any): HTMLCanvasElement);
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.image = this.ctx.createImageData(256, 240);
    }
    // this.div = ((document.getElementById('nes-div'): any): HTMLElement);
  }

  renderBackground(background: Array<Background>, pallete: Pallete) {
    // this.pallete = pallete;
    if (!this.ctx) return;
    // TODO: css renderer, move to css-renderer.js
    // console.time('css renderer');
    // this.div.style.boxShadow = imageData2Css(background);
    // console.timeEnd('css renderer')
    for (let i = 0; i < background.length; i++) {
      const x = (i % 32) * 8;
      const y = ~~(i / 32) * 8;
      this.renderTile(background[i].sprite, x, y, pallete, background[i].palleteId);
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  renderSprites(sprites: Array<SpriteWithAttribute>) {
    if (!this.ctx) return;
    for (const sprite of sprites) {
      if (sprite) {
        this.renderSprite(sprite.sprite, sprite.x, sprite.y);
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  renderTile(sprite: Sprite, x: number, y: number, pallete: Pallete, palleteId: number) {
    if (!this.ctx) return;
    const { data } = this.image;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const colorId = pallete[palleteId * 4 + sprite[i][j]];
        const color = colors[colorId];
        const index = ((x + j) + (y + i) * 256) * 4;
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = 0xFF;
      }
    }
  }  

  renderSprite(sprite: Sprite, x: number, y: number) {
    if (!this.ctx) return;
    const { data } = this.image;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const color = sprite[i][j] * 85;
        const index = ((x + j) + (y + i) * 256) * 4;
        data[index] = color;
        data[index + 1] = color;
        data[index + 2] = color;
        data[index + 3] = 0xFF;
      }
    }
  }
}
