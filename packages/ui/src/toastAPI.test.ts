import { describe, it, expect, vi } from 'vitest';
import { toast } from './toastAPI.js';

describe('toast API', () => {
    it('pushes and dismisses messages', () => {
        toast._store.dismiss(toast._store.messages[0]?.id); // clear just in case

        const spy = vi.fn();
        toast._store.events.on('change', spy);

        const id = toast.info('Hello World', { duration: 0 });
        expect(toast._store.messages.length).toBe(1);
        expect(toast._store.messages[0].text).toBe('Hello World');
        expect(spy).toHaveBeenCalled();

        toast.dismiss(id);
        expect(toast._store.messages.length).toBe(0);
    });

    it('creates different types of toasts', () => {
        toast.success('Success', { duration: 0 });
        toast.warning('Warning', { duration: 0 });
        toast.error('Error', { duration: 0 });
        
        const messages = toast._store.messages;
        expect(messages.find(m => m.type === 'success')).toBeDefined();
        expect(messages.find(m => m.type === 'warning')).toBeDefined();
        expect(messages.find(m => m.type === 'error')).toBeDefined();
        
        for (const m of messages) {
            toast.dismiss(m.id);
        }
    });
});
