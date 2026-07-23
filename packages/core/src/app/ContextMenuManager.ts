import { EventEmitter } from '../events/EventEmitter.js';

export interface ContextMenuItem {
    label: string;
    action?: () => void;
    color?: string;
    disabled?: boolean;
}

export interface ContextMenuState {
    items: ContextMenuItem[];
    x: number;
    y: number;
}

export interface ContextMenuEvents {
    change: ContextMenuState | null;
}

/**
 * Manages the global context menu state for the application.
 */
export class ContextMenuManager {
    private _state: ContextMenuState | null = null;
    readonly events = new EventEmitter<ContextMenuEvents>();

    /**
     * Opens a context menu at the specified terminal coordinates.
     */
    open(items: ContextMenuItem[], x: number, y: number): void {
        this._state = { items, x, y };
        this.events.emit('change', this._state);
    }

    /**
     * Closes the context menu if it is currently open.
     */
    close(): void {
        if (this._state) {
            this._state = null;
            this.events.emit('change', null);
        }
    }

    /**
     * Gets the current context menu state.
     */
    get state(): ContextMenuState | null {
        return this._state;
    }
}
