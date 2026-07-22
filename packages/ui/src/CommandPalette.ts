// CommandPalette — fuzzy-search command launcher
import { Widget } from '@termuijs/widgets';
import { type Style, type Screen, type KeyEvent, mergeStyles, defaultStyle, styleToCellAttrs, getBorderChars, caps, splitGraphemes } from '@termuijs/core';

export interface Command { id: string; label: string; shortcut?: string; action: () => void; category?: string; }
export interface CommandPaletteOptions { placeholder?: string; borderColor?: Style['fg']; activeColor?: Style['fg']; maxVisible?: number; }

export class CommandPalette extends Widget {
    private _commands: Command[];
    private _filtered: { cmd: Command; labelIndices: number[] }[] = [];
    private _query = '';
    private _cursorPos = 0;
    private _selectedIndex = 0;
    private _visible = false;
    private _placeholder: string;
    private _borderColor: Style['fg'];
    private _activeColor: Style['fg'];
    private _maxVisible: number;
    focusable = true;

    constructor(commands: Command[], options: CommandPaletteOptions = {}) {
        super(mergeStyles(defaultStyle(), {}));
        this._commands = commands;
        this._filtered = commands.map(cmd => ({ cmd, labelIndices: [] }));
        this._placeholder = options.placeholder ?? 'Type a command...';
        this._borderColor = options.borderColor ?? { type: 'named', name: 'cyan' };
        this._activeColor = options.activeColor ?? { type: 'named', name: 'cyan' };
        this._maxVisible = options.maxVisible ?? 10;
    }

    get visible(): boolean { return this._visible; }
    show(): void { this._visible = true; this._query = ''; this._cursorPos = 0; this._selectedIndex = 0; this._filtered = this._commands.map(cmd => ({ cmd, labelIndices: [] })); this.markDirty(); }
    hide(): void { this._visible = false; this.markDirty(); }
    toggle(): void { this._visible ? this.hide() : this.show(); }
    insertChar(ch: string): void {
        const query = splitGraphemes(this._query);
        const inserted = splitGraphemes(ch);
        query.splice(this._cursorPos, 0, ...inserted);
        this._query = query.join('');
        this._cursorPos += inserted.length;
        this._filter();
        this.markDirty();
    }
    deleteBack(): void {
        if (this._cursorPos === 0) return;
        const query = splitGraphemes(this._query);
        query.splice(this._cursorPos - 1, 1);
        this._query = query.join('');
        this._cursorPos--;
        this._filter();
        this.markDirty();
    }
    selectNext(): void { if (this._selectedIndex < this._filtered.length - 1) { this._selectedIndex++; this.markDirty(); } }
    selectPrev(): void { if (this._selectedIndex > 0) { this._selectedIndex--; this.markDirty(); } }
    confirm(): void { const c = this._filtered[this._selectedIndex]; if (c) { this.hide(); c.cmd.action(); } }

    /**
     * Handle a KeyEvent from @termuijs/core.
     *
     * Wires all palette interactions to a single entry point so callers
     * only need:
     *   app.on('key', e => palette.handleKey(e))
     *
     * Built-in bindings (only active while the palette is visible):
     *   Ctrl+P          — open / close (toggle)
     *   ArrowUp / k     — move selection up
     *   ArrowDown / j   — move selection down
     *   Enter           — confirm selected command
     *   Escape          — close
     *   Backspace       — delete last character
     *   any printable   — append character to query
     *
     * Ctrl+P is also handled while hidden so the palette can be opened.
     * All handled events have stopPropagation() called automatically.
     */
    handleKey(event: KeyEvent): void {
        // Ctrl+P toggles the palette regardless of current visibility
        if (event.ctrl && event.key === 'p') {
            event.stopPropagation();
            this.toggle();
            return;
        }

        // Remaining bindings only apply while the palette is open
        if (!this._visible) return;

        const { key, ctrl } = event;

        if (key === 'escape' || (ctrl && key === 'c')) {
            event.stopPropagation();
            this.hide();
            return;
        }

        if (key === 'up') {
            event.stopPropagation();
            this.selectPrev();
            return;
        }

        if (key === 'down') {
            event.stopPropagation();
            this.selectNext();
            return;
        }

        if (key === 'return' || key === 'enter') {
            event.stopPropagation();
            this.confirm();
            return;
        }

        if (key === 'backspace' || key === 'delete') {
            event.stopPropagation();
            this.deleteBack();
            return;
        }

        // Printable character — append to query
        // Ignore control sequences (key.length > 1 means special key name)
        if (!ctrl && !event.alt && key.length === 1) {
            event.stopPropagation();
            this.insertChar(key);
        }
    }

    private _fuzzyMatch(query: string, label: string, category: string): { matches: boolean, labelIndices: number[] } {
        if (!query) return { matches: true, labelIndices: [] };
        const q = splitGraphemes(query.toLowerCase());
        const labelG = splitGraphemes(label.toLowerCase());
        const catG = splitGraphemes(category.toLowerCase());
        
        let qi = 0;
        const labelIndices: number[] = [];
        
        // Check label
        for (let i = 0; i < labelG.length && qi < q.length; i++) {
            if (labelG[i] === q[qi]) {
                labelIndices.push(i);
                qi++;
            }
        }
        
        // Check space
        if (qi < q.length && q[qi] === ' ') qi++;
        
        // Check category
        for (let i = 0; i < catG.length && qi < q.length; i++) {
            if (catG[i] === q[qi]) {
                qi++;
            }
        }
        
        return { matches: qi === q.length, labelIndices };
    }

    private _filter(): void {
        const q = this._query;
        if (!q) { 
            this._filtered = this._commands.map(cmd => ({ cmd, labelIndices: [] })); 
        } else {
            this._filtered = [];
            for (const cmd of this._commands) {
                const res = this._fuzzyMatch(q, cmd.label, cmd.category ?? '');
                if (res.matches) {
                    this._filtered.push({ cmd, labelIndices: res.labelIndices });
                }
            }
        }
        this._selectedIndex = 0;
    }

    protected _renderSelf(screen: Screen): void {
        if (!this._visible) return;
        const { x, y, width, height } = this._rect;
        const attrs = styleToCellAttrs(this.style);
        // Backdrop
        const backdropCh = caps.unicode ? '░' : ' ';
        for (let r = 0; r < height; r++) screen.writeString(x, y + r, backdropCh.repeat(width), { ...attrs, dim: true });
        // Box
        const vis = this._filtered.slice(0, this._maxVisible);
        const grouped = new Map<string, { cmd: Command; labelIndices: number[] }[]>();
        for (const item of vis) {
            const category = item.cmd.category ?? 'General';
            if (!grouped.has(category)) {
                grouped.set(category, []);
            }
            grouped.get(category)!.push(item);
        }
        const bw = Math.min(60, width - 4);
        const totalVisRows = grouped.size + vis.length;
        const bh = Math.min(totalVisRows + 3, height - 2);
        const bx = x + Math.floor((width - bw) / 2);
        const by = y + 2;
        const border = getBorderChars('single');
        if (!border) return;
        const ba = { ...attrs, fg: this._borderColor };
        // Top
        screen.writeString(bx, by, border.topLeft + border.top.repeat(bw - 2) + border.topRight, ba);
        // Input row
        screen.writeString(bx, by + 1, border.left, ba);
        const input = this._query || this._placeholder;
        screen.writeString(bx + 1, by + 1, (` ${caps.unicode ? '🔍' : '[?]'} ` + input).slice(0, bw - 2).padEnd(bw - 2), { ...attrs, dim: !this._query });
        screen.writeString(bx + bw - 1, by + 1, border.right, ba);
        // Separator
        screen.writeString(bx, by + 2, border.left + '─'.repeat(bw - 2) + border.right, ba);
        // Items
        let rowOffset = 0;

for (const [category, items] of grouped) {
    screen.writeString(
        bx + 1,
        by + 3 + rowOffset,
        `[${category}]`,
        { ...attrs, bold: true }
    );

    rowOffset++;

    for (const item of items) {
        const c = item.cmd;
        const active = rowOffset - 1 === this._selectedIndex;
        const matchSet = new Set(item.labelIndices);

        const prefix = active ? (caps.unicode ? '❯ ' : '> ') : '  ';
        const shortcutStr = c.shortcut ? `  ${c.shortcut}` : '';
        const maxLabelWidth = bw - 4 - stringWidth(prefix) - stringWidth(shortcutStr);
        
        let cursorX = bx + 1;

        // Write prefix
        screen.writeString(cursorX, by + 3 + rowOffset, prefix, {
            ...attrs,
            fg: active ? this._activeColor : attrs.fg,
            bold: active,
        });
        cursorX += stringWidth(prefix);

        // Write label with fuzzy highlighting
        const graphemes = splitGraphemes(c.label);
        let labelWidth = 0;
        
        for (let i = 0; i < graphemes.length; i++) {
            const char = graphemes[i];
            const chW = stringWidth(char);
            if (labelWidth + chW > maxLabelWidth) break;
            
            const isMatch = matchSet.has(i);
            screen.setCell(cursorX, by + 3 + rowOffset, {
                ...attrs,
                char: char || ' ',
                fg: isMatch ? this._activeColor : (active ? this._activeColor : attrs.fg),
                bold: active || isMatch,
            });
            cursorX += chW;
            labelWidth += chW;
        }

        // Pad remainder of label space
        if (labelWidth < maxLabelWidth) {
            screen.writeString(cursorX, by + 3 + rowOffset, ' '.repeat(maxLabelWidth - labelWidth), attrs);
            cursorX += maxLabelWidth - labelWidth;
        }

        // Write shortcut
        if (shortcutStr) {
            screen.writeString(cursorX, by + 3 + rowOffset, shortcutStr, {
                ...attrs,
                fg: active ? this._activeColor : attrs.fg,
                bold: active,
            });
        }

        rowOffset++;
    }
}
        // Bottom
        const last = Math.min(by + 3 + totalVisRows, by + bh - 1);
        screen.writeString(bx, last, border.bottomLeft + border.bottom.repeat(bw - 2) + border.bottomRight, ba);
    }
}
