(function () {
  'use strict';

  const W = 384;
  const H = 248;
  const C = {
    sky: '#112435', distant: '#1b3441', hill: '#1b4148', pineBack: '#16323a',
    pineMid: '#1a4140', pineTop: '#24564a', pineLight: '#326554', trunk: '#263b3c',
    earth: '#243e3a', grass: '#315949', grassTop: '#477055', grassLight: '#66805a',
    deep: '#142a30', moss: '#42654d', rock: '#658078', rockDark: '#3d5754',
    bark: '#674c39', barkLight: '#99704a', barkDark: '#3b3731',
    flameDark: '#cc6735', flame: '#f09a40', gold: '#ffd471', core: '#fff0b0',
    moon: '#d8debc', moonShade: '#a3bba7', flower: '#d5b58b', leaf: '#8a9c60'
  };

  function seeded(seed) {
    return function () {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  class EmberScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.canvas.width = W;
      this.canvas.height = H;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.ctx.imageSmoothingEnabled = false;
      this.spriteLevel = 0;
      this.kilnLevel = 0;
      this.blueUnlocked = false;
      this.blueTier = 0;
      this.reducedMotion = false;
      this.dead = false;
      this.lastFrame = -Infinity;
      this.burstTime = -Infinity;
      this.lastSparkTime = -Infinity;
      this.needsDraw = true;
      this.sparks = [];
      this.background = document.createElement('canvas');
      this.background.width = W;
      this.background.height = H;
      this.makeBackground();
      this.frame = this.frame.bind(this);
      this.draw(performance.now());
      this.raf = requestAnimationFrame(this.frame);
    }

    rect(ctx, color, x, y, w, h) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    poly(ctx, color, points) {
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach((point, i) => i ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1]));
      ctx.closePath();
      ctx.fill();
    }

    pine(ctx, x, bottom, height, color, highlights) {
      const width = Math.round(height * 0.42);
      const top = bottom - height;
      this.rect(ctx, C.trunk, x - 2, top + height * 0.45, 5, height * 0.55);
      for (let tier = 0; tier < 5; tier++) {
        const y = Math.round(top + tier * height * 0.155);
        const half = Math.round(width * (0.2 + tier * 0.18));
        const tierHeight = Math.round(height * 0.31);
        this.poly(ctx, color, [[x, y], [x + 3, y], [x + 3, y + 5], [x + half, y + tierHeight - 3], [x + half, y + tierHeight], [x - half, y + tierHeight], [x - half, y + tierHeight - 3], [x - 3, y + 5], [x - 3, y]]);
        if (highlights) {
          this.rect(ctx, highlights, x - half + 3, y + tierHeight - 3, Math.max(3, half - 2), 2);
          this.rect(ctx, highlights, x - Math.max(2, half / 2), y + tierHeight - 7, Math.max(2, half / 3), 2);
        }
      }
    }

    rock(ctx, x, y, size, lit) {
      this.poly(ctx, C.rockDark, [[x, y + 3], [x + 3, y], [x + size - 3, y], [x + size, y + 3], [x + size, y + 7], [x, y + 7]]);
      this.rect(ctx, lit ? '#9e9c77' : C.rock, x + 3, y, size - 6, 2);
      this.rect(ctx, lit ? '#7c8267' : '#536d64', x + 1, y + 3, size - 2, 2);
    }

    mushroom(ctx, x, y, orange) {
      this.rect(ctx, '#9f9c77', x + 3, y + 4, 2, 5);
      this.rect(ctx, orange ? '#c38056' : '#8f8d9b', x + 1, y + 1, 6, 4);
      this.rect(ctx, orange ? '#dca374' : '#b2a4b2', x + 2, y, 4, 2);
      this.rect(ctx, orange ? '#764d40' : '#65556f', x, y + 4, 8, 2);
      this.rect(ctx, '#debf94', x + 2, y + 2, 1, 1);
      this.rect(ctx, '#debf94', x + 5, y + 3, 1, 1);
    }

    makeBackground() {
      const ctx = this.background.getContext('2d', { alpha: false });
      ctx.imageSmoothingEnabled = false;
      const rand = seeded(2049);
      this.rect(ctx, C.sky, 0, 0, W, H);
      this.rect(ctx, '#172e3d', 0, 60, W, 45);
      this.rect(ctx, '#1d3741', 0, 99, W, 45);

      // Square-edged halo, stepped crescent, and tiny constellations.
      this.rect(ctx, '#1c3441', 291, 14, 48, 40);
      this.rect(ctx, '#203a43', 297, 10, 36, 48);
      this.rect(ctx, '#29464b', 301, 16, 28, 36);
      this.poly(ctx, C.moon, [[309, 19], [321, 19], [321, 22], [327, 22], [327, 28], [330, 28], [330, 40], [327, 40], [327, 46], [321, 46], [321, 49], [309, 49], [309, 46], [303, 46], [303, 40], [300, 40], [300, 28], [303, 28], [303, 22], [309, 22]]);
      this.poly(ctx, C.moonShade, [[309, 21], [306, 27], [306, 39], [312, 45], [324, 45], [320, 49], [309, 49], [309, 46], [303, 46], [303, 40], [300, 40], [300, 28], [303, 28], [303, 22]]);
      this.rect(ctx, '#b5c5ac', 320, 27, 4, 4);
      this.rect(ctx, '#c3cfb2', 315, 38, 3, 3);
      this.stars = [];
      for (let i = 0; i < 37; i++) {
        const x = 15 + Math.floor(rand() * 354);
        const y = 9 + Math.floor(rand() * 79);
        if (x > 288 && x < 340 && y < 60) continue;
        const bright = i % 7 === 0;
        this.rect(ctx, bright ? '#93a9a1' : '#4e7077', x, y, bright ? 2 : 1, bright ? 2 : 1);
        if (bright) this.stars.push({ x, y, phase: rand() * 6 });
      }

      // Distant slopes and overlapping forest silhouettes.
      this.poly(ctx, C.distant, [[0, 110], [28, 94], [50, 94], [77, 80], [101, 80], [135, 93], [154, 93], [174, 106], [206, 106], [236, 91], [254, 91], [285, 102], [318, 102], [347, 83], [365, 83], [384, 91], [384, 167], [0, 167]]);
      this.poly(ctx, C.hill, [[0, 132], [53, 112], [80, 112], [119, 126], [160, 126], [181, 115], [208, 115], [250, 127], [282, 127], [327, 111], [362, 111], [384, 119], [384, 168], [0, 168]]);
      for (let x = -7; x < 400; x += 23 + Math.floor(rand() * 13)) this.pine(ctx, x, 135 + rand() * 9, 56 + rand() * 33, C.pineBack);
      for (const tree of [[16, 167, 126], [58, 159, 99], [99, 151, 74], [278, 151, 82], [325, 164, 119], [371, 170, 137]]) this.pine(ctx, ...tree, C.pineMid, '#245047');

      // Stepped, mossy clearing with the warm pool of light at its center.
      this.poly(ctx, C.earth, [[0, 166], [29, 157], [55, 157], [55, 152], [90, 152], [90, 147], [130, 147], [130, 142], [238, 142], [238, 147], [283, 147], [283, 151], [325, 151], [325, 158], [361, 158], [384, 167], [384, 248], [0, 248]]);
      this.poly(ctx, C.grass, [[58, 173], [78, 162], [115, 162], [115, 155], [150, 155], [150, 151], [228, 151], [228, 155], [271, 155], [271, 164], [307, 164], [324, 177], [311, 189], [272, 189], [272, 199], [220, 199], [220, 205], [148, 205], [148, 200], [107, 200], [107, 192], [72, 192]]);
      this.poly(ctx, '#3a5d49', [[111, 171], [133, 162], [164, 162], [164, 157], [217, 157], [217, 162], [249, 162], [265, 173], [265, 186], [240, 193], [147, 193], [147, 188], [120, 188]]);
      this.poly(ctx, '#4b6549', [[147, 174], [160, 165], [178, 165], [178, 161], [210, 161], [210, 165], [229, 165], [242, 176], [235, 186], [151, 186]]);
      this.rect(ctx, '#596a49', 167, 170, 50, 17);

      for (let i = 0; i < 260; i++) {
        const x = Math.floor(rand() * W);
        const y = 153 + Math.floor(rand() * 89);
        if (Math.abs(x - 192) < 40 && y < 197) continue;
        const shade = [C.grassTop, C.moss, '#385547', '#1c3936'][i % 4];
        this.rect(ctx, shade, x, y, 2 + Math.floor(rand() * 5), 1);
        if (i % 7 === 0) this.rect(ctx, shade, x + 1, y - 3, 1, 3);
      }
      // A path of small, subdued stepping stones.
      for (const [x, y, size] of [[218, 201, 13], [232, 215, 16], [244, 234, 19]]) {
        this.rock(ctx, x, y, size, false);
        this.rect(ctx, C.moss, x + 1, y + 5, 3, 2);
      }
      this.rock(ctx, 98, 177, 16, false);
      this.rock(ctx, 293, 190, 21, false);
      this.rock(ctx, 319, 200, 11, false);
      for (const [x, y] of [[78, 169], [84, 172], [283, 163], [291, 160], [51, 209], [330, 179]]) this.mushroom(ctx, x, y, x < 100);
      for (const [x, y] of [[121, 164], [263, 194], [69, 190], [292, 212], [146, 213]]) {
        this.rect(ctx, C.grassLight, x + 1, y, 1, 6);
        this.rect(ctx, C.flower, x, y - 2, 3, 3);
        this.rect(ctx, '#b68e68', x + 1, y - 1, 1, 1);
      }

      // Fallen log to the left; a little seat beside the fire.
      this.poly(ctx, C.barkDark, [[110, 181], [118, 177], [148, 185], [151, 190], [144, 196], [112, 187]]);
      this.poly(ctx, C.bark, [[111, 179], [119, 175], [149, 183], [151, 188], [144, 192], [113, 184]]);
      this.rect(ctx, C.barkLight, 112, 179, 7, 6);
      this.rect(ctx, '#b08d5b', 113, 180, 4, 3);
      this.rect(ctx, C.barkDark, 115, 181, 1, 1);
      this.poly(ctx, '#876545', [[122, 178], [141, 183], [141, 185], [122, 180]]);
      this.rect(ctx, C.moss, 135, 181, 6, 2);

      // Fire pit. Rear stones are baked into the environment.
      this.rect(ctx, '#253c34', 171, 174, 43, 13);
      for (const [x, y, size] of [[173, 174, 10], [184, 171, 10], [196, 171, 10], [207, 176, 9]]) this.rock(ctx, x, y, size, true);

      // Foreground framing trees and ferns keep the clearing intimate.
      this.pine(ctx, -4, 228, 205, '#102b30', '#1a3c3c');
      this.pine(ctx, 389, 235, 191, '#102b30', '#1a3c3c');
      this.poly(ctx, '#142f32', [[0, 232], [24, 226], [45, 226], [45, 230], [77, 230], [77, 238], [122, 238], [122, 244], [182, 244], [182, 248], [0, 248]]);
      this.poly(ctx, '#142f32', [[384, 223], [361, 220], [345, 226], [318, 226], [318, 233], [294, 233], [294, 242], [271, 242], [271, 248], [384, 248]]);
      for (const [x, y] of [[34, 223], [62, 234], [315, 234], [352, 217]]) {
        this.rect(ctx, '#365a49', x, y - 12, 2, 15);
        for (let i = 0; i < 3; i++) {
          this.rect(ctx, '#365a49', x - 4 - i * 2, y - 9 + i * 4, 5 + i * 2, 2);
          this.rect(ctx, '#43654e', x + 2, y - 10 + i * 4, 5 + i * 2, 2);
        }
      }
    }

    drawFire(time) {
      const ctx = this.ctx;
      const t = this.reducedMotion ? 0 : Math.floor(time / 125);
      const burst = this.reducedMotion ? 0 : Math.max(0, 1 - (time - this.burstTime) / 650);
      const height = [0, 3, 1, 4, 2, 0, 2, 1][t % 8] + Math.round(burst * 7);
      ctx.save();
      ctx.globalAlpha = 0.09 + burst * 0.04;
      this.rect(ctx, '#ffbd63', 148, 146, 88, 43);
      this.rect(ctx, '#ffd78b', 159, 137, 66, 50);
      this.rect(ctx, '#ffc979', 169, 132, 46, 53);
      ctx.restore();

      const jolt = burst > 0.5 ? 1 : 0;
      this.poly(ctx, C.barkDark, [[174, 174], [181, 171 - jolt], [209, 181], [207, 187], [177, 179]]);
      this.poly(ctx, C.bark, [[175, 171], [180, 168 - jolt], [210, 179], [208, 182], [178, 175]]);
      this.poly(ctx, C.barkDark, [[179, 181], [205, 170], [211, 174], [183, 187]]);
      this.poly(ctx, C.barkLight, [[179, 178], [205, 168], [209, 172], [183, 182]]);
      this.rect(ctx, '#e38c45', 184, 177, 14, 3);

      // Deliberately stepped silhouettes, without gradients or smoothing.
      this.poly(ctx, C.flameDark, [[177, 174], [174, 166], [177, 159], [180, 161], [180, 149 - height], [184, 153 - height], [187, 143 - height], [187, 136 - height], [191, 140 - height], [194, 151 - height], [198, 148], [202, 138 - height], [205, 144], [204, 155], [208, 153], [211, 164], [207, 174], [200, 178], [185, 178]]);
      this.poly(ctx, C.flame, [[181, 172], [178, 166], [181, 159], [184, 160], [185, 151 - height], [189, 155 - height], [192, 145 - height], [195, 158], [200, 154], [202, 148], [203, 160], [207, 163], [204, 173], [197, 177], [186, 176]]);
      this.poly(ctx, C.gold, [[184, 171], [183, 164], [187, 161], [189, 153 - Math.floor(height / 2)], [192, 158], [193, 165], [198, 158], [200, 163], [202, 170], [198, 175], [188, 175]]);
      this.poly(ctx, C.core, [[188, 171], [188, 167], [191, 163], [194, 168], [197, 167], [197, 173], [192, 175]]);
      this.rock(ctx, 173, 182, 12, true);
      this.rock(ctx, 187, 185, 12, true);
      this.rock(ctx, 201, 183, 12, true);
      this.rect(ctx, '#d6ab6b', 180, 182, 3, 1);
      this.rect(ctx, '#d6ab6b', 190, 185, 5, 1);

      if (!this.reducedMotion) {
        for (let i = 0; i < 6; i++) {
          const age = ((time / 1000) * (0.28 + i * 0.022) + i / 6) % 1;
          const x = 190 + Math.round(Math.sin(age * 8 + i * 2) * (5 + age * 9));
          const y = 144 - Math.round(age * 37);
          ctx.globalAlpha = 1 - age;
          this.rect(ctx, i % 2 ? C.flame : C.gold, x, y, i % 3 ? 1 : 2, 2);
        }
        ctx.globalAlpha = 1;
        this.sparks = this.sparks.filter(spark => time - spark.born < spark.life);
        for (const spark of this.sparks) {
          const age = (time - spark.born) / spark.life;
          ctx.globalAlpha = 1 - age;
          this.rect(ctx, spark.color, 192 + spark.vx * age, 154 - spark.vy * age + 12 * age * age, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
    }

    drawSprites(time) {
      if (this.spriteLevel <= 0) return;
      const ctx = this.ctx;
      const x = 153;
      const y = 144 + (this.reducedMotion ? 0 : Math.round(Math.sin(time / 700) * 3));
      const stronger = this.spriteLevel >= 5;
      // Levels brighten this same companion; they never add more sprites.
      ctx.globalAlpha = stronger ? 0.2 : 0.12;
      this.rect(ctx, '#ffca75', x - 4, y - 4, 15, 17);
      ctx.globalAlpha = 1;
      this.rect(ctx, '#d58047', x + 1, y - 2, 3, 3);
      this.rect(ctx, '#f2b85f', x, y, 7, 6);
      this.rect(ctx, stronger ? '#ffe6a2' : '#ffdb84', x + 1, y - 1, 5, 7);
      this.rect(ctx, '#f4b65f', x + 2, y + 6, 3, 2);
      this.rect(ctx, '#674a37', x + 1, y + 2, 1, 2);
      this.rect(ctx, '#674a37', x + 5, y + 2, 1, 2);
      this.rect(ctx, '#ffe6aa', x + 2, y, 2, 1);
      this.rect(ctx, '#cc8d4d', x - 2, y + 3, 2, 2);
      this.rect(ctx, '#cc8d4d', x + 7, y + 3, 2, 2);
      if (this.spriteLevel >= 10) {
        this.rect(ctx, '#fff1bd', x + 1, y - 5, 1, 3);
        this.rect(ctx, '#fff1bd', x + 3, y - 6, 1, 4);
        this.rect(ctx, '#fff1bd', x + 5, y - 5, 1, 3);
      }
    }

    drawBlue(time) {
      if (!this.blueUnlocked) return;
      const ctx = this.ctx;
      const x = 219;
      const y = 134 + (this.reducedMotion ? 0 : Math.round(Math.sin(time / 850) * 2));
      const bright = this.blueTier > 0;
      ctx.save();
      ctx.globalAlpha = bright ? 0.16 : 0.1;
      this.rect(ctx, '#67bce8', x - 7, y - 6, 22, 24);
      this.rect(ctx, '#9bdcff', x - 2, y - 10, 12, 31);
      ctx.restore();
      // A separate blue flame keeps the hearth's familiar warmth visible.
      this.poly(ctx, '#3778b6', [[x, y + 11], [x - 2, y + 6], [x + 1, y + 1], [x + 2, y + 4], [x + 3, y - 3], [x + 6, y + 1], [x + 6, y + 4], [x + 9, y + 1], [x + 11, y + 7], [x + 9, y + 12], [x + 4, y + 14]]);
      this.poly(ctx, '#71c9ee', [[x + 1, y + 9], [x + 2, y + 5], [x + 4, y + 7], [x + 5, y + 1], [x + 7, y + 6], [x + 9, y + 8], [x + 7, y + 12], [x + 3, y + 12]]);
      this.rect(ctx, bright ? '#e4f7ff' : '#b9eaff', x + 4, y + 8, 3, 4);
      if (!this.reducedMotion) {
        const age = (time / 1500) % 1;
        ctx.globalAlpha = 1 - age;
        this.rect(ctx, '#9ddfff', x + 4 + Math.round(Math.sin(age * 5) * 4), y - 7 - Math.round(age * 15), 1, 2);
        ctx.globalAlpha = 1;
      }
    }

    drawKiln(time) {
      if (!this.kilnLevel) return;
      const ctx = this.ctx;
      const pulse = this.reducedMotion ? 0 : Math.floor(time / 220) % 3;
      const trim = this.kilnLevel >= 5 ? '#d9b674' : '#9d9579';
      ctx.save();
      ctx.globalAlpha = 0.1;
      this.rect(ctx, '#f5ba67', 242, 165, 50, 29);
      this.rect(ctx, '#f7cc7b', 250, 158, 34, 35);
      ctx.restore();
      // A squat brick furnace, chimney, iron door, and softly glowing coals.
      this.rect(ctx, '#23352f', 248, 188, 39, 5);
      this.rect(ctx, '#576058', 250, 184, 35, 6);
      this.rect(ctx, '#343f3a', 253, 188, 7, 4);
      this.rect(ctx, '#343f3a', 276, 188, 6, 4);
      this.rect(ctx, '#59645d', 276, 147, 7, 24);
      this.rect(ctx, '#859080', 274, 146, 11, 3);
      this.rect(ctx, '#3c4a44', 277, 149, 5, 12);
      this.rect(ctx, '#7c7c66', 278, 152, 4, 2);
      this.rect(ctx, '#7c7c66', 277, 157, 4, 2);
      this.poly(ctx, '#505b50', [[250, 185], [250, 169], [254, 169], [254, 162], [260, 162], [260, 158], [274, 158], [274, 162], [280, 162], [280, 168], [284, 168], [284, 185]]);
      this.poly(ctx, '#7d7c63', [[253, 182], [253, 170], [257, 170], [257, 164], [262, 164], [262, 161], [272, 161], [272, 164], [277, 164], [277, 170], [281, 170], [281, 182]]);
      this.rect(ctx, trim, 258, 165, 6, 2);
      this.rect(ctx, trim, 267, 163, 6, 2);
      this.rect(ctx, '#525b4e', 254, 173, 5, 2);
      this.rect(ctx, '#525b4e', 275, 175, 6, 2);
      this.rect(ctx, '#b3a07a', 255, 179, 4, 2);
      this.rect(ctx, '#172a27', 260, 171, 13, 14);
      this.rect(ctx, '#26352a', 262, 168, 9, 4);
      this.rect(ctx, '#af6238', 261, 177, 11, 7);
      this.rect(ctx, '#ed9848', 263, 174 - pulse, 3, 10 + pulse);
      this.rect(ctx, '#ed9848', 268, 176 - pulse, 3, 8 + pulse);
      this.rect(ctx, '#ffd27a', 264, 179 - pulse, 2, 5 + pulse);
      this.rect(ctx, '#f9c56c', 268, 180, 2, 4);
      this.rect(ctx, '#3f4132', 260, 182, 13, 2);
      this.rect(ctx, trim, 260, 184, 13, 2);
      this.rect(ctx, '#a5a080', 254, 185, 26, 2);
      if (this.kilnLevel >= 10) {
        this.rect(ctx, '#ddb976', 253, 170, 2, 10);
        this.rect(ctx, '#ddb976', 279, 170, 2, 10);
      }
      if (!this.reducedMotion) {
        const age = (time / 1700) % 1;
        ctx.globalAlpha = (1 - age) * 0.28;
        this.rect(ctx, '#8b9b8a', 277 + Math.round(age * 5), 142 - Math.round(age * 14), 4 + Math.round(age * 3), 3);
        ctx.globalAlpha = 1;
      }
    }

    draw(time) {
      this.ctx.drawImage(this.background, 0, 0);
      this.drawKiln(time);
      this.drawFire(time);
      this.drawBlue(time);
      this.drawSprites(time);
      if (!this.reducedMotion) {
        for (const star of this.stars) {
          this.ctx.globalAlpha = (Math.sin(time / 1900 + star.phase) + 1) * 0.22;
          this.rect(this.ctx, '#e3dcb5', star.x, star.y, 2, 2);
        }
        // Two dim fireflies drift near the edge of the clearing.
        for (let i = 0; i < 3; i++) {
          const x = [99, 275, 138][i] + Math.round(Math.sin(time / 2600 + i * 3) * 8);
          const y = [141, 135, 113][i] + Math.round(Math.cos(time / 2000 + i * 2) * 5);
          this.ctx.globalAlpha = 0.25 + Math.max(0, Math.sin(time / 1000 + i * 2)) * 0.5;
          this.rect(this.ctx, '#b8cd7e', x, y, 1, 2);
        }
        this.ctx.globalAlpha = 1;
      }
    }

    frame(time) {
      if (this.dead) return;
      if (!document.hidden && (this.needsDraw || !this.reducedMotion) && time - this.lastFrame >= 80) {
        this.draw(time);
        this.lastFrame = time;
        this.needsDraw = false;
      }
      this.raf = requestAnimationFrame(this.frame);
    }

    setSprites(level) {
      this.spriteLevel = Math.max(0, Math.floor(Number(level) || 0));
      this.needsDraw = true;
    }

    setKiln(level) {
      this.kilnLevel = Math.max(0, Math.floor(Number(level) || 0));
      this.needsDraw = true;
    }

    setBlue(unlocked, amount) {
      const enabled = Boolean(unlocked);
      const tier = Number.isFinite(amount) && amount >= 1000 ? 1 : 0;
      if (this.blueUnlocked === enabled && this.blueTier === tier) return;
      this.blueUnlocked = enabled;
      this.blueTier = tier;
      this.needsDraw = true;
    }

    stoke() {
      const time = performance.now();
      this.burstTime = time;
      if (!this.reducedMotion && time - this.lastSparkTime >= 50) {
        this.lastSparkTime = time;
        for (let i = 0; i < 6; i++) this.sparks.push({ born: time, life: 450 + i * 53, vx: (i - 2.5) * 7, vy: 25 + ((i * 13) % 29), color: this.blueUnlocked && i === 2 ? '#8edaff' : i % 2 ? C.gold : C.flame });
        if (this.sparks.length > 40) this.sparks.splice(0, this.sparks.length - 40);
      }
      // Input may arrive far faster than visual frames. Never redraw here.
      this.needsDraw = true;
    }

    setReducedMotion(reduced) {
      this.reducedMotion = Boolean(reduced);
      this.sparks = [];
      this.needsDraw = true;
    }

    getFirePosition() {
      return { x: 192, y: 158, width: W, height: H };
    }

    destroy() {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.sparks = [];
    }
  }

  window.EmberScene = EmberScene;
}());
