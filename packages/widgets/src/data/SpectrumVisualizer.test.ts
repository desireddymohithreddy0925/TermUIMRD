import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Screen, caps } from '@termuijs/core';
import { SpectrumVisualizer } from './SpectrumVisualizer.js';

describe('SpectrumVisualizer', () => {
    let screen: Screen;

    beforeEach(() => {
        screen = new Screen(40, 10);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders correct number of full and partial blocks based on data', () => {
        // Mock unicode so we can assert on blocks reliably
        vi.spyOn(caps, 'unicode', 'get').mockReturnValue(true);

        const viz = new SpectrumVisualizer(
            { width: 10, height: 4 },
            { 
                data: [0, 8, 64, 128, 255], 
                maxVal: 255, 
                barWidth: 1, 
                gap: 1 
            }
        );

        viz.updateRect({ x: 0, y: 0, width: 10, height: 4 });
        viz.render(screen);

        // Data array represents 5 bars.
        // Bar 0: 0/255 -> 0 blocks -> all spaces
        // Bar 1: 8/255 -> 1/32 height -> 1 block -> bottom cell is \u2581
        // Bar 2: 64/255 -> 25% height -> 1 out of 4 cells should be full (or 8/32 blocks, i.e. 1 full cell)
        // Bar 3: 128/255 -> 50% height -> 2 full cells
        // Bar 4: 255/255 -> 100% height -> 4 full cells

        // Check top row (y = 0)
        expect(screen.back[0][0].char).toBe(' '); // Bar 0
        expect(screen.back[0][2].char).toBe(' '); // Bar 1
        expect(screen.back[0][4].char).toBe(' '); // Bar 2
        expect(screen.back[0][6].char).toBe(' '); // Bar 3
        expect(screen.back[0][8].char).toBe('█'); // Bar 4

        // Check bottom row (y = 3)
        expect(screen.back[3][0].char).toBe(' '); // Bar 0
        expect(screen.back[3][2].char).toBe('\u2581'); // Bar 1
        expect(screen.back[3][4].char).toBe('█'); // Bar 2
        expect(screen.back[3][6].char).toBe('█'); // Bar 3
        expect(screen.back[3][8].char).toBe('█'); // Bar 4
    });

    it('falls back to ascii characters when unicode is disabled', () => {
        vi.spyOn(caps, 'unicode', 'get').mockReturnValue(false);

        const viz = new SpectrumVisualizer(
            { width: 10, height: 4 },
            { 
                data: [128, 255], 
                maxVal: 255, 
                barWidth: 2, 
                gap: 0
            }
        );

        viz.updateRect({ x: 0, y: 0, width: 10, height: 4 });
        viz.render(screen);

        // Full block should be '#'
        expect(screen.back[3][2].char).toBe('#');
        expect(screen.back[3][3].char).toBe('#');
    });

    it('respects color gradients', () => {
        const viz = new SpectrumVisualizer(
            { width: 10, height: 4 },
            { 
                data: [50, 100, 150],
                maxVal: 200,
                barWidth: 1,
                gap: 1,
                colorGradient: [
                    { type: 'named', name: 'blue' },
                    { type: 'named', name: 'magenta' }
                ]
            }
        );

        viz.updateRect({ x: 0, y: 0, width: 10, height: 4 });
        viz.render(screen);

        const color0 = screen.back[3][0].fg;
        const color1 = screen.back[3][2].fg;
        const color2 = screen.back[3][4].fg;
        
        expect(color0).toEqual({ type: 'named', name: 'blue' });
        // color1 could be blue or magenta depending on math floor, but color2 should be magenta
        expect(color2).toEqual({ type: 'named', name: 'magenta' });
    });

    it('updates data and marks dirty', () => {
        const viz = new SpectrumVisualizer();
        expect(viz.isDirty).toBe(true); // initially dirty
        viz.clearDirty();

        viz.setData([1, 2, 3]);
        expect(viz.isDirty).toBe(true); // should be marked dirty
    });
});
