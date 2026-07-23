import { EventEmitter } from '../events/EventEmitter.js';

export interface TooltipState {
    text: string;
    x: number;
    y: number;
}

export interface TooltipEvents {
    change: TooltipState | null;
}

/**
 * Manages the global tooltip state for the application.
 */
export class TooltipManager {
    private _state: TooltipState | null = null;
    readonly events = new EventEmitter<TooltipEvents>();

    /**
     * Opens a tooltip at the specified terminal coordinates.
     */
    open(text: string, x: number, y: number): void {
        this._state = { text, x, y };
        this.events.emit('change', this._state);
    }

    /**
     * Closes the tooltip if it is currently open.
     */
    close(): void {
        if (this._state) {
            this._state = null;
            this.events.emit('change', null);
        }
    }

    /**
     * Gets the current tooltip state.
     */
    get state(): TooltipState | null {
        return this._state;
    }
}
