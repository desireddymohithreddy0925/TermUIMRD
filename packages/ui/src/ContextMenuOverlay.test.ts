import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Screen, App } from '@termuijs/core';
import { Widget } from '@termuijs/widgets';
import { ContextMenuOverlay } from './ContextMenuOverlay.js';

class MockRoot extends Widget {}

describe('ContextMenuOverlay', () => {
    let app: App;
    let overlay: ContextMenuOverlay;

    beforeEach(() => {
        app = new App(new MockRoot());
        overlay = new ContextMenuOverlay({ app });
    });

    it('should open context menu via ContextMenuManager', () => {
        const screen = new Screen(40, 10);
        app.screen = screen;
        
        const items = [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' }
        ];

        app.contextMenu.open(5, 5, items);

        overlay.updateRect({ x: 0, y: 0, width: 40, height: 10 });
        overlay.render(screen);
        
        expect(app.contextMenu.isOpen).toBe(true);
        expect(overlay.children.length).toBe(1);
    });

    it('should close context menu via ContextMenuManager', () => {
        const items = [{ label: 'Option 1', value: 'opt1' }];
        app.contextMenu.open(5, 5, items);
        expect(app.contextMenu.isOpen).toBe(true);

        app.contextMenu.close();
        
        expect(app.contextMenu.isOpen).toBe(false);
        expect(overlay.children.length).toBe(0);
    });
});
