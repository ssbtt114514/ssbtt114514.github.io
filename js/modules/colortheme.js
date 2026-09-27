/**
 * ColorThemeModule — 头像莫奈动态取色
 * 从头像图片中提取主色调，动态应用到背景、强调色等
 * 头像更换时自动重新取色（每次页面加载时执行）
 */
window.ColorThemeModule = {
    currentPalette: null,
    isDark: false,

    /**
     * 从图片 URL 提取调色板
     */
    async extractFromImage(imageUrl) {
        try {
            const img = await this._loadImage(imageUrl);
            return this._extractPalette(img, 10);
        } catch (e) {
            console.warn('[ColorTheme] 取色失败，使用默认配色:', e.message);
            return null;
        }
    },

    /**
     * 加载图片，处理 CORS（直连失败时走代理）
     */
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => this._loadViaProxy(url).then(resolve).catch(reject);
            img.src = url;
        });
    },

    async _loadViaProxy(url) {
        const proxies = [
            'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
            'https://corsproxy.io/?' + encodeURIComponent(url),
        ];
        for (const proxyUrl of proxies) {
            try {
                const resp = await fetch(proxyUrl, { mode: 'cors' });
                if (!resp.ok) continue;
                const blob = await resp.blob();
                const objUrl = URL.createObjectURL(blob);
                const img = await new Promise((res, rej) => {
                    const im = new Image();
                    im.onload = () => res(im);
                    im.onerror = rej;
                    im.src = objUrl;
                });
                URL.revokeObjectURL(objUrl);
                return img;
            } catch (e) { /* try next proxy */ }
        }
        throw new Error('所有代理均失败');
    },

    /**
     * 核心：从图片提取调色板
     * 降采样 → 量化 → 按饱和度/亮度筛选 → 按频次排序
     */
    _extractPalette(img, maxColors = 10) {
        // 48×48 足够稳定，同时比原来的 64×64 少 44% 像素处理量。
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 125) continue;

            // 16 步量化，减少颜色桶数量，让调色板更稳定。
            const r = Math.min(255, Math.round(data[i] / 16) * 16);
            const g = Math.min(255, Math.round(data[i + 1] / 16) * 16);
            const b = Math.min(255, Math.round(data[i + 2] / 16) * 16);
            const hsl = this._rgbToHsl(r, g, b);

            // 去掉接近纯黑/纯白和低信息灰色，但保留柔和的莫奈色。
            if (hsl.l < 0.06 || hsl.l > 0.96) continue;
            const key = r + ',' + g + ',' + b;
            const old = buckets.get(key);
            buckets.set(key, old ? old + 1 : 1);
        }

        const sorted = Array.from(buckets.entries())
            .sort((a, b) => b[1] - a[1]);

        // 用“频率 + 饱和度 + 中等亮度 + 色相间距”挑选真正互补的颜色。
        const candidates = sorted.map(([key, count]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { r, g, b, hsl: this._rgbToHsl(r, g, b), count };
        });

        const palette = [];
        for (const item of candidates) {
            const { s, l } = item.hsl;
            const score = item.count *
                (0.55 + Math.min(1, s * 1.8)) *
                (0.75 + (1 - Math.abs(l - 0.52)));

            item.score = score;
            if (palette.length === 0) {
                palette.push(item);
                continue;
            }

            const separated = palette.every(p => {
                let d = Math.abs(item.hsl.h - p.hsl.h);
                d = Math.min(d, 1 - d);
                return d > 0.055 || Math.abs(item.hsl.l - p.hsl.l) > 0.16;
            });

            if (separated) palette.push(item);
            if (palette.length >= maxColors) break;
        }

        // 若色相过于集中，用高频颜色补齐。
        for (const item of candidates) {
            if (palette.length >= maxColors) break;
            if (!palette.includes(item)) palette.push(item);
        }

        if (palette.length < 2) {
            const fallback = candidates[0] || {
                r: 102, g: 126, b: 234,
                hsl: this._rgbToHsl(102, 126, 234),
                count: 1
            };
            palette.push(fallback);
        }

        return palette.slice(0, maxColors);
    },

    /**
     * 将调色板应用到页面
     */
    applyTheme(palette) {
        if (!palette || palette.length === 0) return;
        this.currentPalette = palette;
        this.isDark = document.body.classList.contains('dark');

        const root = document.documentElement;
        // 把完整调色板暴露给 CSS。背景动画只移动 transform，不在每帧修改颜色。
        const monet = palette.slice(0, 4);
        const monetColors = monet.map((c, i) => {
            const v = this.isDark ? this._darken(c, 0.22) : c;
            const rgb = `rgb(${Math.round(v.r)}, ${Math.round(v.g)}, ${Math.round(v.b)})`;
            root.style.setProperty(`--monet-${i + 1}`, rgb);
            return rgb;
        });
        while (monetColors.length < 4) {
            const fallback = monetColors[monetColors.length - 1] || 'rgb(102,126,234)';
            root.style.setProperty(`--monet-${monetColors.length + 1}`, fallback);
            monetColors.push(fallback);
        }


        // 按"活力值"排序：饱和度 × 亮度适中度
        const byVibrance = [...palette].sort((a, b) => {
            const va = a.hsl.s * (1 - Math.abs(a.hsl.l - 0.45));
            const vb = b.hsl.s * (1 - Math.abs(b.hsl.l - 0.45));
            return vb - va;
        });

        const primary = byVibrance[0];
        const secondary = byVibrance[1] || palette[1] || primary;
        const tertiary = byVibrance[2] || palette[2] || secondary;

        // 暗色模式下加深颜色
        const adj = (c) => this.isDark ? this._darken(c, 0.35) : c;
        const p = adj(primary), s = adj(secondary), t = adj(tertiary);

        // 设置 CSS 变量
        root.style.setProperty('--primary', `rgb(${p.r},${p.g},${p.b})`);
        root.style.setProperty('--primary-2', `rgb(${s.r},${s.g},${s.b})`);
        root.style.setProperty('--primary-glow', `rgba(${p.r},${p.g},${p.b},0.45)`);

        // 同步移动端浏览器主题色
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', `rgb(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)})`);

        // 背景渐变：取前 4 个主色，莫奈式多色渐变
        const bgColors = palette.slice(0, Math.min(4, palette.length)).map(c => adj(c));
        // 暗色模式用更深的渐变
        if (this.isDark) {
            bgColors.forEach((c, i) => { bgColors[i] = this._darken(c, 0.55); });
        }
        const stops = bgColors.map((c, i) =>
            `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}) ${Math.round(i / (bgColors.length - 1) * 100)}%`
        ).join(', ');

        // 保留 body 的纯色兜底；动态渐变交给独立的 .monet-background，
        // 避免频繁修改 body background 导致整页重绘。
        document.body.style.background = `rgb(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)})`;

        // 更新液态玻璃 token
        root.style.setProperty('--lg-border',
            this.isDark ? 'rgba(255,255,255,0.12)' : `rgba(${p.r},${p.g},${p.b},0.2)`);
    },

    /**
     * 重新应用当前调色板（用于暗色模式切换）
     */
    reapply() {
        if (this.currentPalette) this.applyTheme(this.currentPalette);
    },

    /**
     * 从头像 URL 初始化
     */
    async initFromAvatar(avatarUrl) {
        const palette = await this.extractFromImage(avatarUrl);
        if (palette) {
            this.applyTheme(palette);
            console.log('[ColorTheme] 莫奈取色完成，提取 ' + palette.length + ' 种颜色');
        }
        return palette;
    },

    // ===== 工具函数 =====
    _rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h, s, l };
    },

    _hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    },

    _darken(color, amount) {
        const hsl = this._rgbToHsl(color.r, color.g, color.b);
        hsl.l = Math.max(0.08, hsl.l * (1 - amount));
        hsl.s = Math.min(1, hsl.s * 1.15);
        return this._hslToRgb(hsl.h, hsl.s, hsl.l);
    },
};
