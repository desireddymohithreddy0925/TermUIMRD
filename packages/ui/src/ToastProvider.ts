import { Widget } from '@termuijs/widgets';
import { type Screen, caps, type Color } from '@termuijs/core';
import { animateSpring } from '@termuijs/motion';
import { toast, type ToastMessage } from './toastAPI.js';

export interface ToastProviderOptions {
    position?: 'bottom-right' | 'top-right';
    maxVisible?: number;
    width?: number;
}

const TYPE_ICONS: Record<ToastMessage['type'], { unicode: string; ascii: string }> = {
    info:    { unicode: 'ℹ', ascii: 'i' },
    success: { unicode: '✓', ascii: '+' },
    warning: { unicode: '⚠', ascii: '!' },
    error:   { unicode: '✗', ascii: 'x' },
};

const TYPE_COLORS: Record<ToastMessage['type'], Color> = {
    info:    { type: 'named', name: 'cyan' },
    success: { type: 'named', name: 'green' },
    warning: { type: 'named', name: 'yellow' },
    error:   { type: 'named', name: 'red' },
};

interface RenderableToast {
    message: ToastMessage;
    offsetX: number; // 0 means fully visible, width means fully off-screen right
    cancelAnim?: () => void;
    removing: boolean;
}

export class ToastProvider extends Widget {
    private _position: NonNullable<ToastProviderOptions['position']>;
    private _maxVisible: number;
    private _toastWidth: number;
    private _unsub?: () => void;
    
    private _activeToasts: RenderableToast[] = [];

    constructor(options: ToastProviderOptions = {}) {
        super();
        this._position = options.position ?? 'bottom-right';
        this._maxVisible = options.maxVisible ?? 5;
        this._toastWidth = options.width ?? 40;

        this._unsub = toast._store.events.on('change', (messages) => {
            this._syncMessages(messages);
        });
        
        // Load initial
        this._syncMessages(toast._store.messages);
    }

    override unmount(): void {
        this._cleanup();
        super.unmount();
    }

    override destroy(): void {
        this._cleanup();
        super.destroy();
    }

    private _cleanup(): void {
        if (this._unsub) {
            this._unsub();
            this._unsub = undefined;
        }
        for (const t of this._activeToasts) {
            if (t.cancelAnim) t.cancelAnim();
        }
        this._activeToasts = [];
    }

    private _syncMessages(newMessages: ToastMessage[]): void {
        const newIds = new Set(newMessages.map(m => m.id));
        
        // Find removed messages and animate them out
        for (const active of this._activeToasts) {
            if (!newIds.has(active.message.id) && !active.removing) {
                active.removing = true;
                if (active.cancelAnim) active.cancelAnim();
                
                active.cancelAnim = animateSpring(active.offsetX, this._toastWidth, 'default', (val) => {
                    active.offsetX = val;
                    this.markDirty();
                }, () => {
                    // Remove from active completely
                    this._activeToasts = this._activeToasts.filter(t => t !== active);
                    this.markDirty();
                });
            }
        }
        
        // Add new messages
        const activeIds = new Set(this._activeToasts.map(t => t.message.id));
        for (const msg of newMessages) {
            if (!activeIds.has(msg.id)) {
                const rt: RenderableToast = {
                    message: msg,
                    offsetX: this._toastWidth,
                    removing: false
                };
                
                rt.cancelAnim = animateSpring(this._toastWidth, 0, 'gentle', (val) => {
                    rt.offsetX = val;
                    this.markDirty();
                });
                
                this._activeToasts.push(rt);
            }
        }
        
        this.markDirty();
    }

    protected override _renderSelf(screen: Screen): void {
        const { x, y, width, height } = this._rect;
        if (width <= 2 || height <= 1) return;

        // Filter and slice visible toasts (including those animating out)
        const visible = this._activeToasts.slice(-this._maxVisible).slice(-(height - 1));
        if (visible.length === 0) return;

        const tw = Math.min(this._toastWidth, width - 2);
        if (tw <= 0) return;

        const isBottom = this._position === 'bottom-right';
        const sy = isBottom ? y + height - visible.length - 1 : y + 1;

        for (let i = 0; i < visible.length; i++) {
            const rt = visible[i];
            const msg = rt.message;
            
            // Calculate starting X based on animation offset
            const offsetChars = Math.round(rt.offsetX);
            if (offsetChars >= tw) continue; // Fully off-screen
            
            const sx = x + width - tw - 1 + offsetChars;
            const visibleTw = tw - offsetChars;
            
            const icon = caps.unicode
                ? TYPE_ICONS[msg.type].unicode
                : TYPE_ICONS[msg.type].ascii;

            const raw = `${icon} ${msg.text}`;
            const label = ` ${raw} `.slice(0, visibleTw).padEnd(visibleTw);

            screen.writeString(sx, sy + i, label, {
                fg: TYPE_COLORS[msg.type],
                bold: true,
            });
        }
    }
}
