import { describe, it, expect, vi } from 'vitest';
import { App, Screen, type ContextMenuItem } from '@termuijs/core';
import { Widget } from '@termuijs/widgets';
import { ContextMenu } from './ContextMenu.js';

describe('ContextMenu UI Component', () => {
    it('subscribes to app contextMenu events and renders menu', () => {
        // Create an app instance
        const root = new Widget();
        const app = new App(root);
        
        const contextMenu = new ContextMenu({ app });
        
        // Initially not visible
        const screen = new Screen(40, 10);
        contextMenu.updateRect({ x: 0, y: 0, width: 40, height: 10 });
        contextMenu.render(screen);
        
        expect(screen.back[0].map(c => c.char).join('').trim()).toBe('');

        // Open context menu via App
        const actionSpy = vi.fn();
        const items: ContextMenuItem[] = [{ label: 'Item 1', action: actionSpy }];
        app.contextMenu.open(items, 5, 2);

        // Render again
        contextMenu.render(screen);
        
        const row2 = screen.back[2].map(c => c.char).join('');
        expect(row2).toContain('Item 1');
    });

    it('closes when clicking outside', () => {
        const root = new Widget();
        const app = new App(root);
        
        const contextMenu = new ContextMenu({ app });
        
        app.contextMenu.open([{ label: 'Test' }], 10, 10);
        expect(app.contextMenu.state).not.toBeNull();

        // Simulate click outside
        app.events.emit('mouse', {
            type: 'mousedown',
            button: 'left',
            x: 0,
            y: 0,
            shift: false,
            alt: false,
            ctrl: false
        } as any);

        expect(app.contextMenu.state).toBeNull();
    });
});
