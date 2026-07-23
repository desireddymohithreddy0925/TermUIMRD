import { describe, it, expect, vi } from 'vitest';
import { ContextMenuManager, type ContextMenuItem } from './ContextMenuManager.js';

describe('ContextMenuManager', () => {
    it('initializes with null state', () => {
        const manager = new ContextMenuManager();
        expect(manager.state).toBeNull();
    });

    it('opens context menu and emits change event', () => {
        const manager = new ContextMenuManager();
        const spy = vi.fn();
        manager.events.on('change', spy);

        const items: ContextMenuItem[] = [{ label: 'Copy' }];
        manager.open(items, 10, 20);

        expect(manager.state).toEqual({ items, x: 10, y: 20 });
        expect(spy).toHaveBeenCalledWith({ items, x: 10, y: 20 });
    });

    it('closes context menu and emits change event', () => {
        const manager = new ContextMenuManager();
        const spy = vi.fn();
        manager.events.on('change', spy);

        const items: ContextMenuItem[] = [{ label: 'Copy' }];
        manager.open(items, 10, 20);
        
        spy.mockClear();
        manager.close();

        expect(manager.state).toBeNull();
        expect(spy).toHaveBeenCalledWith(null);
    });

    it('does not emit on close if already closed', () => {
        const manager = new ContextMenuManager();
        const spy = vi.fn();
        manager.events.on('change', spy);

        manager.close();
        expect(spy).not.toHaveBeenCalled();
    });
});
