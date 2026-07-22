// ─────────────────────────────────────────────────────
// @termuijs/widgets — TextEditor widget
// ─────────────────────────────────────────────────────

import {
    type Screen,
    type Style,
    type Color,
    type KeyEvent,
    caps,
    styleToCellAttrs,
    splitGraphemes,
    stringWidth,
    truncate
} from '@termuijs/core';
import { Widget } from '../base/Widget.js';

export interface TextEditorOptions {
    content?: string;
    language?: 'typescript' | 'javascript' | 'json' | 'markdown' | 'text';
    lineNumbers?: boolean;
    theme?: 'monokai' | 'default';
    onChange?: (value: string) => void;
}

interface Cursor {
    line: number;
    col: number;
}

interface Token {
    text: string;
    type: 'keyword' | 'string' | 'number' | 'comment' | 'punctuation' | 'default';
}

/**
 * TextEditor — a multi-line text editor widget with basic syntax highlighting.
 */
export class TextEditor extends Widget {
    private _lines: string[] = [''];
    private _cursor: Cursor = { line: 0, col: 0 };
    private _scrollOffset: Cursor = { line: 0, col: 0 };
    
    private _language: string;
    private _lineNumbers: boolean;
    private _theme: string;
    private _onChange?: (value: string) => void;

    constructor(style: Partial<Style> = {}, opts: TextEditorOptions = {}) {
        super(style);
        this.focusable = true;
        
        if (opts.content !== undefined) {
            this._lines = opts.content.split('\n');
            if (this._lines.length === 0) {
                this._lines = [''];
            }
        }
        
        this._language = opts.language ?? 'text';
        this._lineNumbers = opts.lineNumbers ?? false;
        this._theme = opts.theme ?? 'default';
        this._onChange = opts.onChange;
    }

    get content(): string {
        return this._lines.join('\n');
    }

    set content(val: string) {
        this._lines = val.split('\n');
        if (this._lines.length === 0) {
            this._lines = [''];
        }
        this._cursor = { line: 0, col: 0 };
        this._scrollOffset = { line: 0, col: 0 };
        this.markDirty();
    }

    handleKey(event: KeyEvent): void {
        switch (event.key) {
            case 'up':
                this._moveCursor(this._cursor.line - 1, this._cursor.col);
                break;
            case 'down':
                this._moveCursor(this._cursor.line + 1, this._cursor.col);
                break;
            case 'left':
                if (this._cursor.col > 0) {
                    this._moveCursor(this._cursor.line, this._cursor.col - 1);
                } else if (this._cursor.line > 0) {
                    const prevLineLen = splitGraphemes(this._lines[this._cursor.line - 1]).length;
                    this._moveCursor(this._cursor.line - 1, prevLineLen);
                }
                break;
            case 'right': {
                const currLineLen = splitGraphemes(this._lines[this._cursor.line]).length;
                if (this._cursor.col < currLineLen) {
                    this._moveCursor(this._cursor.line, this._cursor.col + 1);
                } else if (this._cursor.line < this._lines.length - 1) {
                    this._moveCursor(this._cursor.line + 1, 0);
                }
                break;
            }
            case 'home':
                this._moveCursor(this._cursor.line, 0);
                break;
            case 'end':
                this._moveCursor(this._cursor.line, splitGraphemes(this._lines[this._cursor.line]).length);
                break;
            case 'pageup':
                this._moveCursor(Math.max(0, this._cursor.line - 10), this._cursor.col);
                break;
            case 'pagedown':
                this._moveCursor(Math.min(this._lines.length - 1, this._cursor.line + 10), this._cursor.col);
                break;
            case 'enter':
            case 'return':
                this._insertNewLine();
                break;
            case 'space':
                this._insertChar(' ');
                break;
            case 'backspace':
                this._deleteBack();
                break;
            case 'delete':
                this._deleteForward();
                break;
            default:
                if (event.key && splitGraphemes(event.key).length === 1 && !event.ctrl && !event.alt) {
                    this._insertChar(event.key);
                }
                break;
        }
        
        // Ensure cursor is visible
        this._scrollToCursor();
    }

    private _moveCursor(line: number, col: number): void {
        this._cursor.line = Math.max(0, Math.min(line, this._lines.length - 1));
        const lineLen = splitGraphemes(this._lines[this._cursor.line]).length;
        this._cursor.col = Math.max(0, Math.min(col, lineLen));
        this.markDirty();
    }

    private _insertChar(char: string): void {
        const graphemes = splitGraphemes(this._lines[this._cursor.line]);
        graphemes.splice(this._cursor.col, 0, char);
        this._lines[this._cursor.line] = graphemes.join('');
        this._cursor.col++;
        this._triggerChange();
    }

    private _insertNewLine(): void {
        const graphemes = splitGraphemes(this._lines[this._cursor.line]);
        const left = graphemes.slice(0, this._cursor.col).join('');
        const right = graphemes.slice(this._cursor.col).join('');
        
        this._lines[this._cursor.line] = left;
        this._lines.splice(this._cursor.line + 1, 0, right);
        this._cursor.line++;
        this._cursor.col = 0;
        this._triggerChange();
    }

    private _deleteBack(): void {
        if (this._cursor.col > 0) {
            const graphemes = splitGraphemes(this._lines[this._cursor.line]);
            graphemes.splice(this._cursor.col - 1, 1);
            this._lines[this._cursor.line] = graphemes.join('');
            this._cursor.col--;
            this._triggerChange();
        } else if (this._cursor.line > 0) {
            const prevLine = this._lines[this._cursor.line - 1];
            const currLine = this._lines[this._cursor.line];
            this._cursor.col = splitGraphemes(prevLine).length;
            this._lines[this._cursor.line - 1] = prevLine + currLine;
            this._lines.splice(this._cursor.line, 1);
            this._cursor.line--;
            this._triggerChange();
        }
    }

    private _deleteForward(): void {
        const graphemes = splitGraphemes(this._lines[this._cursor.line]);
        if (this._cursor.col < graphemes.length) {
            graphemes.splice(this._cursor.col, 1);
            this._lines[this._cursor.line] = graphemes.join('');
            this._triggerChange();
        } else if (this._cursor.line < this._lines.length - 1) {
            const currLine = this._lines[this._cursor.line];
            const nextLine = this._lines[this._cursor.line + 1];
            this._lines[this._cursor.line] = currLine + nextLine;
            this._lines.splice(this._cursor.line + 1, 1);
            this._triggerChange();
        }
    }

    private _triggerChange(): void {
        this.markDirty();
        this._onChange?.(this.content);
    }

    private _scrollToCursor(): void {
        const rect = this._getContentRect();
        const { width, height } = rect;
        if (width <= 0 || height <= 0) return;

        let gutterWidth = 0;
        if (this._lineNumbers) {
            gutterWidth = String(this._lines.length).length + 2;
        }

        const visibleWidth = width - gutterWidth;
        
        if (this._cursor.line < this._scrollOffset.line) {
            this._scrollOffset.line = this._cursor.line;
            this.markDirty();
        } else if (this._cursor.line >= this._scrollOffset.line + height) {
            this._scrollOffset.line = this._cursor.line - height + 1;
            this.markDirty();
        }

        if (this._cursor.col < this._scrollOffset.col) {
            this._scrollOffset.col = this._cursor.col;
            this.markDirty();
        } else if (this._cursor.col >= this._scrollOffset.col + visibleWidth) {
            this._scrollOffset.col = this._cursor.col - visibleWidth + 1;
            this.markDirty();
        }
    }

    private _tokenize(line: string): Token[] {
        if (this._language !== 'typescript' && this._language !== 'javascript') {
            return [{ text: line, type: 'default' }];
        }

        // Basic tokenizer for JS/TS
        const tokens: Token[] = [];
        let current = '';
        let i = 0;

        const pushToken = (type: Token['type']) => {
            if (current) {
                tokens.push({ text: current, type });
                current = '';
            }
        };

        const isAlpha = (c: string) => /[a-zA-Z_]/.test(c);
        const isDigit = (c: string) => /[0-9]/.test(c);
        const isSpace = (c: string) => /\s/.test(c);

        const keywords = new Set(['const', 'let', 'var', 'function', 'class', 'import', 'export', 'if', 'else', 'return', 'true', 'false', 'new', 'this']);

        while (i < line.length) {
            const char = line[i];

            if (line.substring(i, i + 2) === '//') {
                pushToken('default');
                tokens.push({ text: line.substring(i), type: 'comment' });
                break;
            }

            if (char === '"' || char === "'" || char === '`') {
                pushToken('default');
                const quote = char;
                current += quote;
                i++;
                while (i < line.length && line[i] !== quote) {
                    current += line[i];
                    i++;
                }
                if (i < line.length) {
                    current += line[i];
                    i++;
                }
                pushToken('string');
                continue;
            }

            if (isAlpha(char)) {
                pushToken('default');
                while (i < line.length && (isAlpha(line[i]) || isDigit(line[i]))) {
                    current += line[i];
                    i++;
                }
                if (keywords.has(current)) {
                    pushToken('keyword');
                } else {
                    pushToken('default');
                }
                continue;
            }

            if (isDigit(char)) {
                pushToken('default');
                while (i < line.length && (isDigit(line[i]) || line[i] === '.')) {
                    current += line[i];
                    i++;
                }
                pushToken('number');
                continue;
            }

            if (isSpace(char)) {
                pushToken('default');
                while (i < line.length && isSpace(line[i])) {
                    current += line[i];
                    i++;
                }
                pushToken('default');
                continue;
            }

            pushToken('default');
            current += char;
            pushToken('punctuation');
            i++;
        }

        pushToken('default');
        return tokens;
    }

    private _getTokenColor(type: Token['type']): Color | undefined {
        if (this._theme === 'monokai') {
            switch (type) {
                case 'keyword': return { type: 'named', name: 'magenta' };
                case 'string': return { type: 'named', name: 'yellow' };
                case 'number': return { type: 'named', name: 'cyan' };
                case 'comment': return { type: 'named', name: 'brightBlack' };
                case 'punctuation': return { type: 'named', name: 'white' };
                default: return { type: 'named', name: 'white' };
            }
        }
        return undefined; // default theme
    }

    protected _renderSelf(screen: Screen): void {
        const rect = this._getContentRect();
        const { x, y, width, height } = rect;
        if (width <= 0 || height <= 0) return;

        const attrs = styleToCellAttrs(this._style);
        
        let gutterWidth = 0;
        if (this._lineNumbers) {
            gutterWidth = String(this._lines.length).length + 2;
        }

        const maxVisibleWidth = width - gutterWidth;
        
        for (let row = 0; row < height; row++) {
            const lineIdx = this._scrollOffset.line + row;
            if (lineIdx >= this._lines.length) break;

            const lineText = this._lines[lineIdx];
            
            // Draw gutter
            if (this._lineNumbers) {
                const sep = caps.unicode ? '│' : '|';
                const lineNumStr = String(lineIdx + 1).padStart(gutterWidth - 2, ' ') + ` ${sep}`;
                screen.writeString(x, y + row, lineNumStr, { ...attrs, dim: true });
            }

            const tokens = this._tokenize(lineText);
            
            let currentCol = 0;
            let screenX = x + gutterWidth;

            for (const token of tokens) {
                const tokenGraphemes = splitGraphemes(token.text);
                const fg = this._getTokenColor(token.type);
                
                for (let i = 0; i < tokenGraphemes.length; i++) {
                    const char = tokenGraphemes[i];
                    if (currentCol >= this._scrollOffset.col && currentCol < this._scrollOffset.col + maxVisibleWidth) {
                        screen.setCell(screenX, y + row, {
                            ...attrs,
                            char: char[0] || ' ',
                            fg: fg ?? attrs.fg
                        });
                        screenX += stringWidth(char);
                    }
                    currentCol++;
                }
            }

            // Draw cursor
            if (this.isFocused && lineIdx === this._cursor.line) {
                const cursorColScreen = x + gutterWidth + this._cursor.col - this._scrollOffset.col;
                if (cursorColScreen >= x + gutterWidth && cursorColScreen < x + width) {
                    const graphemes = splitGraphemes(lineText);
                    const charUnderCursor = this._cursor.col < graphemes.length ? graphemes[this._cursor.col] : ' ';
                    
                    screen.setCell(cursorColScreen, y + row, {
                        ...attrs,
                        char: charUnderCursor[0] || ' ',
                        inverse: true
                    });
                }
            }
        }
    }
}
