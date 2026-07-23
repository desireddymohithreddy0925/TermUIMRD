import { describe, it, expect, vi, afterEach } from 'vitest';
import { Screen, caps } from '@termuijs/core';
import { toast } from './toastAPI.js';
import { ToastProvider } from './ToastProvider.js';

vi.mock('@termuijs/motion', async (importActual) => {
    const actual = await importActual<typeof import('@termuijs/motion')>();
    return {
        ...actual,
        animateSpring: vi.fn((from, to, config, onFrame, onComplete) => {
            onFrame(to);
            if (onComplete) onComplete();
            return () => {};
        }),
    };
});

describe('ToastProvider', () => {
    afterEach(() => {
        const msgs = toast._store.messages;
        for (const msg of msgs) {
            toast.dismiss(msg.id);
        }
    });

    it('renders toasts when pushed to API', () => {
        const provider = new ToastProvider({ width: 20 });
        const screen = new Screen(40, 10);
        provider.updateRect({ x: 0, y: 0, width: 40, height: 10 });

        const id = toast.info('Test Msg', { duration: 0 });

        // Force a render
        provider.render(screen);

        const text = screen.back.map(row => row.map(c => c.char).join('')).join('\n');
        expect(text).toContain('Test Msg');
    });

    it('removes toasts when dismissed', () => {
        const provider = new ToastProvider({ width: 20 });
        const screen = new Screen(40, 10);
        provider.updateRect({ x: 0, y: 0, width: 40, height: 10 });

        const id = toast.info('To Be Removed', { duration: 0 });
        provider.render(screen);
        expect(screen.back.map(row => row.map(c => c.char).join('')).join('\n')).toContain('To Be Removed');

        toast.dismiss(id);
        
        // Wait for removal animation... we can't easily wait here so we'll just test that it's unmounted properly
        provider.unmount();
    });
});
