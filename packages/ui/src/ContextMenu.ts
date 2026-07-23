import { Widget } from '@termuijs/widgets';
import { type Screen, type Rect, type Style, type App, mergeStyles, defaultStyle, styleToCellAttrs, type ContextMenuItem } from '@termuijs/core';
import { Menu } from './Menu.js';

export interface ContextMenuOptions {
    app: App;
    style?: Partial<Style>;
}

export class ContextMenu extends Widget {
    private _app: App;
    private _menu: Menu | null = null;
    private _visible = false;
    private _menuX = 0;
    private _menuY = 0;

    constructor(options: ContextMenuOptions) {
        // High zIndex to appear over everything
        super(mergeStyles(defaultStyle(), { zIndex: 2000, ...options.style }));
        this._app = options.app;
        
        // Listen to the global context menu state
        this._app.contextMenu.events.on('change', (state) => {
            if (state) {
                this._open(state.items, state.x, state.y);
            } else {
                this._close();
            }
        });

        // Close on outside clicks
        this._app.events.on('mouse', (event) => {
            if (this._visible && event.type === 'mousedown') {
                const { x, y } = event;
                if (this._menu) {
                    const r = this._menu.rect;
                    if (x < r.x || x >= r.x + r.width || y < r.y || y >= r.y + r.height) {
                        this._app.contextMenu.close();
                    }
                }
            }
        });
    }

    private _open(items: ContextMenuItem[], x: number, y: number): void {
        this._visible = true;
        
        const menuItems = items.map(item => ({
            label: item.label,
            disabled: item.disabled,
            onSelect: () => {
                this._app.contextMenu.close();
                item.action?.();
            }
        }));

        this._menu = new Menu({ items: menuItems });
        this._menu.parent = this;
        
        // Calculate max width based on labels
        let maxW = 10;
        for (const it of menuItems) {
            if (it.label.length + 4 > maxW) maxW = it.label.length + 4;
        }

        const h = menuItems.length;

        // Prevent overflow on screen edges
        const screenW = this._app.screen.cols;
        const screenH = this._app.screen.rows;

        this._menuX = x + maxW > screenW ? screenW - maxW : x;
        this._menuY = y + h > screenH ? Math.max(0, screenH - h) : y;
        
        this._menu.updateRect({ x: this._menuX, y: this._menuY, width: maxW, height: h });
        
        // Give focus to the menu so it handles keyboard events
        this._app.focus.focusWidget(this._menu.id);
        this.markDirty();
    }

    private _close(): void {
        this._visible = false;
        if (this._menu) {
            this._menu = null;
        }
        this.markDirty();
    }

    override updateRect(rect: Rect): void {
        super.updateRect(rect);
        // The menu's rect is fixed to cursor position, but we update it if needed
        if (this._menu) {
            this._menu.updateRect({
                x: this._menuX,
                y: this._menuY,
                width: this._menu.rect.width,
                height: this._menu.rect.height
            });
        }
    }

    protected _renderSelf(screen: Screen): void {
        if (!this._visible || !this._menu) return;
        this._menu.render(screen);
    }
}
