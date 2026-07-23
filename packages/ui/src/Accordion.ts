import { Widget } from '@termuijs/widgets';
import { type Screen, type KeyEvent, type Style, mergeStyles, defaultStyle, styleToCellAttrs, caps, truncate } from '@termuijs/core';
import { animateSpring } from '@termuijs/motion';

export interface AccordionItem {
    id: string;
    title: string;
    content: Widget;
}

export interface AccordionOptions {
    items: AccordionItem[];
    allowMultiple?: boolean;
    defaultOpenIds?: string[];
}

interface InternalItem extends AccordionItem {
    isOpen: boolean;
    progress: number;
    cancelAnim?: () => void;
}

export class Accordion extends Widget {
    private _items: InternalItem[] = [];
    private _allowMultiple: boolean;
    private _focusedIndex = 0;

    constructor(options: AccordionOptions, style?: Partial<Style>) {
        super(mergeStyles(defaultStyle(), style ?? {}));
        this._allowMultiple = options.allowMultiple ?? false;

        const defaultOpen = new Set(options.defaultOpenIds ?? []);

        this._items = options.items.map((item, i) => {
            const isOpen = defaultOpen.has(item.id);
            return {
                ...item,
                isOpen,
                progress: isOpen ? 1 : 0
            };
        });

        if (!this._allowMultiple) {
            // Ensure only one is open initially if allowMultiple is false
            let foundOpen = false;
            for (const item of this._items) {
                if (item.isOpen) {
                    if (foundOpen) {
                        item.isOpen = false;
                        item.progress = 0;
                    } else {
                        foundOpen = true;
                    }
                }
            }
        }

        this.focusable = true;
    }

    get items(): AccordionItem[] {
        return this._items;
    }

    handleKey(event: KeyEvent): void {
        const key = event.key.toLowerCase();
        
        if (key === 'up') {
            this._focusedIndex = Math.max(0, this._focusedIndex - 1);
            this.markDirty();
        } else if (key === 'down') {
            this._focusedIndex = Math.min(this._items.length - 1, this._focusedIndex + 1);
            this.markDirty();
        } else if (key === 'enter' || key === ' ' || key === 'space') {
            this.toggle(this._items[this._focusedIndex].id);
        }
    }

    toggle(id: string): void {
        const item = this._items.find(i => i.id === id);
        if (!item) return;

        if (item.isOpen) {
            item.isOpen = false;
            this._animateItem(item, 0);
        } else {
            if (!this._allowMultiple) {
                for (const other of this._items) {
                    if (other.isOpen && other.id !== id) {
                        other.isOpen = false;
                        this._animateItem(other, 0);
                    }
                }
            }
            item.isOpen = true;
            this._animateItem(item, 1);
        }
    }

    private _animateItem(item: InternalItem, target: number): void {
        if (item.cancelAnim) item.cancelAnim();
        item.cancelAnim = animateSpring(item.progress, target, 'default', (val) => {
            item.progress = val;
            this.markDirty();
        });
    }

    protected _renderSelf(screen: Screen): void {
        if (!this.rect || this.rect.width <= 0 || this.rect.height <= 0) return;

        const { x, y, width, height } = this.rect;
        const attrs = styleToCellAttrs(this.style);

        const headersHeight = this._items.length;
        const availableContentHeight = Math.max(0, height - headersHeight);

        // Sum up total progress weight
        let sumProgress = 0;
        for (const item of this._items) {
            sumProgress += item.progress;
        }

        let remainingHeight = Math.round(availableContentHeight * Math.min(1, sumProgress));
        let remainingWeight = sumProgress;

        let currentY = y;

        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            const isFocused = this.isFocused && this._focusedIndex === i;

            // Render Header
            const marker = caps.unicode
                ? (item.isOpen ? '▾' : '▸')
                : (item.isOpen ? 'v' : '>');

            const prefix = isFocused ? '> ' : '  ';
            const headerText = `${prefix}${marker} ${item.title}`;
            const truncatedHeader = truncate(headerText, width);
            
            const headerAttrs = { ...attrs };
            if (isFocused) {
                headerAttrs.fg = { type: 'named', name: 'cyan' };
            }

            screen.writeString(x, currentY, truncatedHeader, headerAttrs);
            currentY++;

            // Calculate content height for this item
            let contentH = 0;
            if (item.progress > 0 && remainingWeight > 0) {
                contentH = Math.round((item.progress / remainingWeight) * remainingHeight);
                remainingHeight -= contentH;
                remainingWeight -= item.progress;
            }

            // Render Content
            if (contentH > 0) {
                const childRect = {
                    x,
                    y: currentY,
                    width,
                    height: contentH
                };
                item.content.updateRect(childRect);
                item.content.render(screen);
                currentY += contentH;
            }
        }
    }
}
