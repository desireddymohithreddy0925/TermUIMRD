import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Screen, App } from '@termuijs/core';
import { Widget } from '@termuijs/widgets';
import { ToastProvider, toast } from './ToastProvider.js';

class MockRoot extends Widget {
    protected _renderSelf(): void {
        // no-op
    }
}

describe('ToastProvider', () => {
    let app: App;
    let toastProvider: ToastProvider;

    beforeEach(() => {
        vi.useFakeTimers();
        app = new App(new MockRoot());
        toastProvider = new ToastProvider({ app });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initially be empty', () => {
        const screen = new Screen(40, 10);
        toastProvider.render(screen);
        const row = screen.back[9].map(c => c.char).join('').trim();
        expect(row).toBe('');
    });

    it('should display a success toast', () => {
        const screen = new Screen(40, 10);
        app.screen = screen;
        
        toast.success('Saved successfully!');
        
        // Fast-forward animation frames
        vi.advanceTimersByTime(600); 

        toastProvider.render(screen);
        
        // Should appear near bottom right
        const row = screen.back[9].map(c => c.char).join('');
        expect(row).toContain('Saved successfully!');
    });

    it('should disappear after duration', () => {
        const screen = new Screen(40, 10);
        app.screen = screen;
        
        toast.success('Will disappear', 1000);
        vi.advanceTimersByTime(600); // appear
        
        toastProvider.render(screen);
        expect(screen.back[9].map(c => c.char).join('')).toContain('Will disappear');

        vi.advanceTimersByTime(1000); // wait duration
        vi.advanceTimersByTime(600); // disappear animation

        // Clear screen to test re-render
        screen.clear();
        toastProvider.render(screen);
        expect(screen.back[9].map(c => c.char).join('')).not.toContain('Will disappear');
    });

    it('should stack multiple toasts', () => {
        const screen = new Screen(40, 10);
        app.screen = screen;
        
        toast.success('First');
        toast.error('Second');
        
        vi.advanceTimersByTime(600); // animate in

        toastProvider.render(screen);
        
        // Second one is added last, so it's at the bottom (y=9). First one is pushed up (y=7).
        expect(screen.back[9].map(c => c.char).join('')).toContain('Second');
        expect(screen.back[7].map(c => c.char).join('')).toContain('First');
    });
});
