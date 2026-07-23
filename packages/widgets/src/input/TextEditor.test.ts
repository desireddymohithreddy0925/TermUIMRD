import { describe, it, expect, beforeEach } from 'vitest';
import { Screen, KeyEvent } from '@termuijs/core';
import { TextEditor } from './TextEditor.js';

describe('TextEditor', () => {
    let screen: Screen;
    let editor: TextEditor;

    beforeEach(() => {
        screen = new Screen(80, 24);
        editor = new TextEditor({}, { content: 'const a = 1;\nlet b = 2;' });
        editor.updateRect({ x: 0, y: 0, width: 80, height: 10 });
    });

    it('renders the content', () => {
        editor.render(screen);
        
        // Row 0 should have "const a = 1;"
        const row0 = screen.back[0].map(c => c.char).join('').trim();
        expect(row0).toContain('const a = 1;');
        
        // Row 1 should have "let b = 2;"
        const row1 = screen.back[1].map(c => c.char).join('').trim();
        expect(row1).toContain('let b = 2;');
    });

    it('handles typing characters', () => {
        editor.content = '';
        editor.render(screen);
        
        // type "x" by emitting via events
        editor.events.emit('key', { key: 'x' } as KeyEvent);
        expect(editor.content).toBe('x');
    });

    it('handles enter / new lines', () => {
        editor.content = 'hello';
        editor.handleKey({ key: 'right' } as KeyEvent);
        editor.handleKey({ key: 'right' } as KeyEvent);
        // cursor is at index 2 ('l')
        editor.handleKey({ key: 'enter' } as KeyEvent);
        
        expect(editor.content).toBe('he\nllo');
    });

    it('handles backspace', () => {
        editor.content = 'hello';
        editor.handleKey({ key: 'right' } as KeyEvent);
        editor.handleKey({ key: 'right' } as KeyEvent);
        // cursor is at index 2 ('l')
        editor.handleKey({ key: 'backspace' } as KeyEvent);
        
        expect(editor.content).toBe('hllo');
    });

    it('handles backspace at start of line to merge lines', () => {
        editor.content = 'hello\nworld';
        editor.handleKey({ key: 'down' } as KeyEvent);
        editor.handleKey({ key: 'home' } as KeyEvent);
        editor.handleKey({ key: 'backspace' } as KeyEvent);
        
        expect(editor.content).toBe('helloworld');
    });

    it('respects lineNumbers and renders gutter', () => {
        editor = new TextEditor({}, { content: 'line 1\nline 2', lineNumbers: true });
        editor.updateRect({ x: 0, y: 0, width: 80, height: 10 });
        editor.render(screen);
        
        const row0 = screen.back[0].map(c => c.char).join('').trim();
        // The first character should be '1', then the pipe
        expect(row0).toMatch(/1\s+│\s*line 1/);
    });
});
