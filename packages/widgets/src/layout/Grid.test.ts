// ─────────────────────────────────────────────────────
// @termuijs/widgets — Tests for CSS Grid layout
// ─────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Grid, GridItem, Col } from './Grid.js';
import { Box } from '../display/Box.js';
import { computeLayout } from '@termuijs/core';

describe('Grid layout', () => {
    it('places children into columns and rows (auto-placement)', () => {
        const grid = new Grid(
            { width: 40, height: 20 },
            { columns: 2, gap: 0 }
        );

        const a = new Box();
        const b = new Box();
        const c = new Box();
        const d = new Box();

        grid.addChild(a);
        grid.addChild(b);
        grid.addChild(c);
        grid.addChild(d);

        const node = grid.getLayoutNode();
        computeLayout(node, 40, 20);
        grid.syncLayout();

        expect(grid.children.length).toBe(4);
        expect(a.rect.x).toBe(0);
        expect(a.rect.y).toBe(0);
        expect(a.rect.width).toBe(20);
        expect(a.rect.height).toBe(10);
    });

    it('applies grid gaps correctly', () => {
        const grid = new Grid(
            { width: 41, height: 21 },
            { columns: 2, gap: 1 }
        );

        const a = new Box();
        const b = new Box();

        grid.addChild(a);
        grid.addChild(b);

        const node = grid.getLayoutNode();
        computeLayout(node, 41, 21);
        grid.syncLayout();

        expect(a.rect.x).toBe(0);
        expect(a.rect.width).toBe(20);
        expect(b.rect.x).toBe(21);
        expect(b.rect.width).toBe(20);
    });
});

describe('Responsive Grid and Col', () => {
    beforeEach(() => {
        vi.stubGlobal('process', { stdout: { columns: 80 } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('renders Col with sm span by default if width is small', () => {
        const grid = new Grid({}, { 
            // Default is 12 columns for Col support
        });
        const col = new Col({}, { span: { sm: 12, md: 6, lg: 4 } });
        grid.addChild(col);

        grid.updateRect({ x: 0, y: 0, width: 50, height: 10 }); // width < 60 is sm
        
        const node = grid.getLayoutNode();
        const colNode = node.children[0];
        
        // 'sm' span is 12
        expect(colNode.style.gridColumnEnd).toBe('span 12');
    });

    it('renders Col with md span when width is medium', () => {
        const grid = new Grid({});
        const col = new Col({}, { span: { sm: 12, md: 6, lg: 4 } });
        grid.addChild(col);

        grid.updateRect({ x: 0, y: 0, width: 80, height: 10 }); // 60 <= width < 120 is md
        
        const node = grid.getLayoutNode();
        const colNode = node.children[0];
        
        // 'md' span is 6
        expect(colNode.style.gridColumnEnd).toBe('span 6');
    });

    it('renders Col with lg span when width is large', () => {
        const grid = new Grid({});
        const col = new Col({}, { span: { sm: 12, md: 6, lg: 4 } });
        grid.addChild(col);

        grid.updateRect({ x: 0, y: 0, width: 150, height: 10 }); // width >= 120 is lg
        
        const node = grid.getLayoutNode();
        const colNode = node.children[0];
        
        // 'lg' span is 4
        expect(colNode.style.gridColumnEnd).toBe('span 4');
    });

    it('falls back correctly if a breakpoint is omitted', () => {
        const grid = new Grid({});
        const col = new Col({}, { span: { sm: 12, lg: 4 } });
        grid.addChild(col);

        // Test md width
        grid.updateRect({ x: 0, y: 0, width: 80, height: 10 }); 
        
        let node = grid.getLayoutNode();
        let colNode = node.children[0];
        
        // Should fall back to sm's value (12) because md is not provided
        expect(colNode.style.gridColumnEnd).toBe('span 12');
        
        // Test lg width
        grid.updateRect({ x: 0, y: 0, width: 150, height: 10 });
        node = grid.getLayoutNode();
        expect(node.children[0].style.gridColumnEnd).toBe('span 4');
    });

    it('uses a flat number for all breakpoints if provided', () => {
        const grid = new Grid({});
        const col = new Col({}, { span: 8 });
        grid.addChild(col);

        grid.updateRect({ x: 0, y: 0, width: 150, height: 10 });
        expect(grid.getLayoutNode().children[0].style.gridColumnEnd).toBe('span 8');

        grid.updateRect({ x: 0, y: 0, width: 40, height: 10 });
        expect(grid.getLayoutNode().children[0].style.gridColumnEnd).toBe('span 8');
    });
});