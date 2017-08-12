/* @flow */

import type { Byte } from '../types/common';
import type { Sprite, SpriteWithAttribute, Background, Palette } from '../ppu';
import { colors } from './colors';
// import { imageData2Css } from './image-data2css';

export default class CanvasRenderer {

  ctx: ?CanvasRenderingContext2D;
  image: any;

  constructor(elementName: string) {
    const canvas = ((document.getElementById(elementName): any): HTMLCanvasElement);
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.image = this.ctx.createImageData(256, 224);
      // this.ctx.scale(2, 2);
    }
    // this.div = ((document.getElementById('nes-div'): any): HTMLElement);
  }

  renderBackground(background: $ReadOnlyArray<Background>, palette: Palette, /* scrollX: Byte, /* TODO: scrollY: Byte */) {
    // this.pallete = pallete;
    if (!this.ctx) return;
    // TODO: css renderer, move to css-renderer.js
    // console.time('css renderer');
    // this.div.style.boxShadow = imageData2Css(background);
    // console.timeEnd('css renderer')
    // console.log(background.length)
    for (let i = 0; i < background.length; i += 1 | 0) {
      const { sprite, paletteId, scrollX, scrollY } = background[i];
      const x = (i % 33) * 8;
      const y = ~~(i / 33) * 8;
      this.renderTile(sprite, x, y, palette, paletteId, scrollX % 8, scrollY % 8);
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  renderSprites(sprites: $ReadOnlyArray<SpriteWithAttribute>, palette: Palette) {
    if (!this.ctx) return;
    for (const sprite of sprites) {
      if (sprite) {
        this.renderSprite(sprite, palette);
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  renderTile(sprite: Sprite, tileX: number, tileY: number, palette: Palette, paletteId: Byte, offsetX: Byte, offsetY: Byte) {
    if (!this.ctx) return;
    const { data } = this.image;
    for (let i = 0; i < 8; i = (i + 1) | 0) {
      for (let j = 0; j < 8; j = (j + 1) | 0) {
        const paletteIndex = paletteId * 4 + sprite[i][j];
        const t = paletteIndex % 4 === 0 ? 0 : paletteIndex;
        const colorId = palette[t];
        const color = colors[colorId];
        const x = tileX + j - offsetX;
        const y = tileY + i - offsetY;
        if (x >= 0 && 0xFF >= x && y >= 0 && y < 224) {
          const index = (x + (y * 0x100)) * 4;
          data[index] = color[0];
          data[index + 1] = color[1];
          data[index + 2] = color[2];
          data[index + 3] = 0xFF;
        }
      }
    }
  }

  renderSprite({ attr, x, y, sprite }: SpriteWithAttribute, palette: Palette) {
    if (!this.ctx) return;
    const { data } = this.image;
    const isVerticalReverse = !!(attr & 0x80);
    const isHorizontalReverse = !!(attr & 0x40);
    // const isLowPriority = !!(attr & 0x20);
    const paletteId = attr & 0x03;
    for (let i = 0; i < 8; i = (i + 1) | 0) {
      for (let j = 0; j < 8; j = (j + 1) | 0) {
        const posX = x + (isHorizontalReverse ? 7 - j : j);
        if (sprite[i][j] && posX < 0x100) {
          const colorId = palette[paletteId * 4 + sprite[i][j] + 0x10];
          const color = colors[colorId];
          const index = (posX + (y + (isVerticalReverse ? 7 - i : i)) * 0x100) * 4;
          data[index] = color[0];
          data[index + 1] = color[1];
          data[index + 2] = color[2];
          data[index + 3] = 0xFF;
        }
      }
    }
  }
}
