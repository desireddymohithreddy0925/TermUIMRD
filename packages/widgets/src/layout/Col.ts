// ─────────────────────────────────────────────────────
// @termuijs/widgets — Col widget
// ─────────────────────────────────────────────────────

import type { Style } from '@termuijs/core';
import { Box } from '../display/Box.js';
import type { Widget } from '../base/Widget.js';

export interface ColSpan {
    sm?: number;
    md?: number;
    lg?: number;
}

export interface ColOptions {
    span?: number | ColSpan;
    children?: Widget[];
}

/**
 * Col — a column in a responsive 12-column grid.
 */
export class Col extends Box {
    private _spanConfig: number | ColSpan;

    constructor(opts: ColOptions = {}, style: Partial<Style> = {}) {
        super(style);
        this._spanConfig = opts.span ?? 12;
        
        if (opts.children) {
            for (const child of opts.children) {
                this.addChild(child);
            }
        }
    }

    /**
     * Updates the gridColumnEnd based on the active breakpoint.
     */
    applyBreakpoint(breakpoint: 'sm' | 'md' | 'lg'): void {
        let span = 12;
        if (typeof this._spanConfig === 'number') {
            span = this._spanConfig;
        } else {
            // Find best match falling back downwards then upwards
            if (breakpoint === 'lg' && this._spanConfig.lg !== undefined) {
                span = this._spanConfig.lg;
            } else if ((breakpoint === 'lg' || breakpoint === 'md') && this._spanConfig.md !== undefined) {
                span = this._spanConfig.md;
            } else if (this._spanConfig.sm !== undefined) {
                span = this._spanConfig.sm;
            } else if (this._spanConfig.md !== undefined) {
                span = this._spanConfig.md;
            } else if (this._spanConfig.lg !== undefined) {
                span = this._spanConfig.lg;
            }
        }

        // Only update if it changed to avoid unnecessary dirty marks
        const newColEnd = `span ${span}`;
        if (this._style.gridColumnEnd !== newColEnd) {
            this._style.gridColumnEnd = newColEnd;
            // markDirty() doesn't need to be called here because this is invoked
            // during layout computation, but we will call it just in case we need
            // to re-layout on resize. Wait, if it's during getLayoutNode(), the
            // node is already dirty or being built. We should not trigger a new loop.
        }
    }
}
