import { describe, it, expect } from 'vitest';
import { Screen } from '@termuijs/core';
import { Box } from '@termuijs/widgets';
import { AnimatedAccordion, AnimatedAccordionItem } from './AnimatedAccordion.js';

describe('AnimatedAccordion', () => {
    it('should initially render all items closed', () => {
        const accordion = new AnimatedAccordion();
        
        const item1 = new AnimatedAccordionItem({
            title: 'Section 1',
            content: new Box()
        });
        
        accordion.addItem(item1);
        
        const screen = new Screen(20, 10);
        accordion.updateRect({ x: 0, y: 0, width: 20, height: 10 });
        accordion.render(screen);
        
        const row = screen.back[0].map(c => c.char).join('');
        expect(row).toContain('▶ Section 1');
    });

    it('should toggle an item and respect allowMultiple', () => {
        const accordion = new AnimatedAccordion({ allowMultiple: false });
        
        const item1 = new AnimatedAccordionItem({ title: 'Section 1', content: new Box() });
        const item2 = new AnimatedAccordionItem({ title: 'Section 2', content: new Box() });
        
        accordion.addItem(item1);
        accordion.addItem(item2);

        item1.isOpen = true; // simulate open
        
        // simulate click on item 2 header (y=1 normally when item1 is open if animation finishes)
        // For testing we can just call the logic
        accordion.events.emit('click' as any, { x: 0, y: 1 } as any);
        
        // Let's manually manipulate and see if we can trigger the exclusive logic
        // We'll mock the internal click handler behavior directly by changing state to see if it responds correctly.
        item2.isOpen = true;
        // In real usage, clicking item 2 while item 1 is open should close item 1.
        // We'll simulate the event emission
        item2.updateRect({ x: 0, y: 1, width: 20, height: 1 });
        accordion.events.emit('click' as any, { x: 0, y: 1, type: 'click' } as any);
        
        expect(item1.isOpen).toBe(false);
        expect(item2.isOpen).toBe(true);
    });
});
