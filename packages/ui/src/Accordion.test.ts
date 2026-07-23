import { describe, it, expect, vi } from 'vitest';
import { Screen, KeyEvent } from '@termuijs/core';
import { Widget } from '@termuijs/widgets';
import { Accordion } from './Accordion.js';

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

describe('Accordion Widget', () => {
    it('renders multiple headers and defaults closed', () => {
        const acc = new Accordion({
            items: [
                { id: '1', title: 'Panel 1', content: new Widget() },
                { id: '2', title: 'Panel 2', content: new Widget() }
            ]
        });

        const screen = new Screen(40, 10);
        acc.updateRect({ x: 0, y: 0, width: 40, height: 10 });
        acc.render(screen);

        const text = screen.back.map(row => row.map(c => c.char).join('')).join('\n');
        expect(text).toContain('Panel 1');
        expect(text).toContain('Panel 2');
        
        expect(acc.items[0].isOpen).toBe(false);
        expect(acc.items[1].isOpen).toBe(false);
    });

    it('toggles open on enter key and closes others if allowMultiple is false', () => {
        const acc = new Accordion({
            items: [
                { id: '1', title: 'Panel 1', content: new Widget() },
                { id: '2', title: 'Panel 2', content: new Widget() }
            ],
            allowMultiple: false
        });

        // App focus is needed for keyboard handling logic but we can call handleKey directly
        acc.handleKey({ key: 'enter', ctrl: false, alt: false, shift: false, meta: false } as KeyEvent);
        
        expect(acc.items[0].isOpen).toBe(true);
        expect(acc.items[1].isOpen).toBe(false);

        // Move down
        acc.handleKey({ key: 'down', ctrl: false, alt: false, shift: false, meta: false } as KeyEvent);
        acc.handleKey({ key: 'enter', ctrl: false, alt: false, shift: false, meta: false } as KeyEvent);

        expect(acc.items[0].isOpen).toBe(false); // Closed because allowMultiple is false
        expect(acc.items[1].isOpen).toBe(true);
    });

    it('allows multiple open if allowMultiple is true', () => {
        const acc = new Accordion({
            items: [
                { id: '1', title: 'Panel 1', content: new Widget() },
                { id: '2', title: 'Panel 2', content: new Widget() }
            ],
            allowMultiple: true,
            defaultOpenIds: ['1']
        });

        expect(acc.items[0].isOpen).toBe(true);
        expect(acc.items[1].isOpen).toBe(false);

        // Move down
        acc.handleKey({ key: 'down', ctrl: false, alt: false, shift: false, meta: false } as KeyEvent);
        acc.handleKey({ key: 'enter', ctrl: false, alt: false, shift: false, meta: false } as KeyEvent);

        expect(acc.items[0].isOpen).toBe(true); // Stays open
        expect(acc.items[1].isOpen).toBe(true);
    });
});
