import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Screen, App, type KeyEvent } from '@termuijs/core';
import { Widget } from '@termuijs/widgets';
import { TooltipOverlay } from './TooltipOverlay.js';

class MockRoot extends Widget {
    override render(screen: Screen): void {
        for (const child of this._children) {
            child.render(screen);
        }
    }
}

describe('TooltipOverlay', () => {
    let app: App;
    let tooltip: TooltipOverlay;

    beforeEach(() => {
        app = new App(new MockRoot());
        tooltip = new TooltipOverlay({ app });
    });

    it('should initially be hidden', () => {
        const screen = new Screen(20, 10);
        tooltip.render(screen);
        const row = screen.back[0].map(c => c.char).join('').trim();
        expect(row).toBe(''); // Nothing rendered
    });

    it('should show tooltip when state changes', () => {
        const screen = new Screen(20, 10);
        app.tooltip.open('Test tip', 2, 2);

        tooltip.render(screen);
        
        // At y=2, x=2, we should see "Test tip"
        const row = screen.back[2].map(c => c.char).join('').trim();
        expect(row).toContain('Test tip');
    });

    it('should adjust position if it overflows the screen', () => {
        const screen = app.screen;
        // screen is 80x24 by default in Terminal mock usually, but let's just use our own screen for render
        // Actually TooltipOverlay uses `app.screen.cols` and `rows` for bounds checking.
        // Let's resize app.screen to known bounds
        app.screen.resize(20, 10);

        // Open tooltip near the right edge
        app.tooltip.open('Very long tooltip', 15, 2);

        const renderScreen = new Screen(20, 10);
        tooltip.render(renderScreen);
        
        // It should shift left to avoid overflow
        // length is 17. 20 - 17 = 3. x should be 3 instead of 15.
        const row = renderScreen.back[2].map(c => c.char).join('');
        expect(row).toContain('   Very long tooltip');
    });

    it('should close tooltip when state is null', () => {
        const screen = new Screen(20, 10);
        app.tooltip.open('Test tip', 2, 2);
        app.tooltip.close();

        tooltip.render(screen);
        const row = screen.back[2].map(c => c.char).join('').trim();
        expect(row).toBe('');
    });
});
