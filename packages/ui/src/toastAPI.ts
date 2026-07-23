import { EventEmitter } from '@termuijs/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
    id: string;
    text: string;
    type: ToastType;
    duration: number;
    createdAt: number;
}

export interface ToastOptions {
    duration?: number;
}

class ToastStore {
    private static _instance: ToastStore;
    private _messages: ToastMessage[] = [];
    readonly events = new EventEmitter<{ change: ToastMessage[] }>();

    static getInstance(): ToastStore {
        if (!ToastStore._instance) {
            ToastStore._instance = new ToastStore();
        }
        return ToastStore._instance;
    }

    push(text: string, type: ToastType, options?: ToastOptions): string {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const message: ToastMessage = {
            id,
            text,
            type,
            duration: options?.duration ?? 3000,
            createdAt: Date.now()
        };

        this._messages.push(message);
        this.events.emit('change', this.messages);

        if (message.duration > 0) {
            setTimeout(() => this.dismiss(id), message.duration);
        }

        return id;
    }

    dismiss(id: string): void {
        const initialLength = this._messages.length;
        this._messages = this._messages.filter(m => m.id !== id);
        if (this._messages.length !== initialLength) {
            this.events.emit('change', this.messages);
        }
    }

    get messages(): ToastMessage[] {
        return [...this._messages];
    }
}

export const toast = {
    info: (text: string, options?: ToastOptions) => ToastStore.getInstance().push(text, 'info', options),
    success: (text: string, options?: ToastOptions) => ToastStore.getInstance().push(text, 'success', options),
    warning: (text: string, options?: ToastOptions) => ToastStore.getInstance().push(text, 'warning', options),
    error: (text: string, options?: ToastOptions) => ToastStore.getInstance().push(text, 'error', options),
    dismiss: (id: string) => ToastStore.getInstance().dismiss(id),
    _store: ToastStore.getInstance() // For internal usage and testing
};
