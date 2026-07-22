// ─────────────────────────────────────────────────────
// @termuijs/widgets — SpectrumVisualizer widget
// ─────────────────────────────────────────────────────

import { type Screen, type Style, type Color, caps, styleToCellAttrs } from '@termuijs/core';
import { Widget } from '../base/Widget.js';

export interface SpectrumVisualizerOptions {
    data?: number[];
    barWidth?: number;
    gap?: number;
    colorGradient?: Color[];
    maxVal?: number;
}

const UNICODE_BLOCKS = [' ', ' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * SpectrumVisualizer — audio spectrum or frequency data visualizer
 */
export class SpectrumVisualizer extends Widget {
    private _data: number[];
    private _barWidth: number;
    private _gap: number;
    private _colorGradient?: Color[];
    private _maxVal: number;

    constructor(style: Partial<Style> = {}, opts: SpectrumVisualizerOptions = {}) {
        super(style);
        this._data = opts.data ?? [];
        this._barWidth = opts.barWidth ?? 2;
        this._gap = opts.gap ?? 1;
        this._colorGradient = opts.colorGradient;
        this._maxVal = opts.maxVal ?? 255;
    }

    setData(data: number[]): void {
        this._data = [...data];
        this.markDirty();
    }

    protected _renderSelf(screen: Screen): void {
        const { x, y, width, height } = this._getContentRect();
        if (width <= 0 || height <= 0 || this._data.length === 0) return;

        const attrs = styleToCellAttrs(this._style);

        // Maximum visual resolution is 8 blocks per cell height
        const maxBlockHeight = height * 8;
        
        const totalBarWidth = this._barWidth + this._gap;
        const maxBars = Math.floor(width / totalBarWidth);
        const barsToRender = Math.min(maxBars, this._data.length);

        for (let i = 0; i < barsToRender; i++) {
            const val = Math.max(0, Math.min(this._maxVal, this._data[i]));
            
            // Map value to number of 1/8th blocks
            const targetHeightBlocks = Math.round((val / this._maxVal) * maxBlockHeight);

            // Determine color for this bar (if gradient provided)
            let fgColor: Color | undefined = attrs.fg;
            if (this._colorGradient && this._colorGradient.length > 0) {
                // Map bar index to gradient index
                const colorIndex = Math.floor((i / barsToRender) * this._colorGradient.length);
                fgColor = this._colorGradient[Math.min(colorIndex, this._colorGradient.length - 1)];
            }

            const barX = x + i * totalBarWidth;

            // Render from bottom to top
            for (let row = 0; row < height; row++) {
                // Calculate how many 1/8th blocks this specific cell row should have
                // row 0 is top, row height-1 is bottom
                const cellBottomBlockIdx = (height - row) * 8;
                const cellTopBlockIdx = (height - row - 1) * 8;

                let char = ' ';
                if (targetHeightBlocks >= cellBottomBlockIdx) {
                    char = caps.unicode ? '█' : '#'; // Full block
                } else if (targetHeightBlocks > cellTopBlockIdx) {
                    const blockVal = targetHeightBlocks - cellTopBlockIdx;
                    char = caps.unicode ? UNICODE_BLOCKS[blockVal] : '-'; // Partial block
                }

                // Draw the bar width
                for (let w = 0; w < this._barWidth; w++) {
                    const drawX = barX + w;
                    if (drawX < x + width) {
                        screen.setCell(drawX, y + row, {
                            char,
                            ...attrs,
                            fg: fgColor
                        });
                    }
                }
            }
        }
    }
}
