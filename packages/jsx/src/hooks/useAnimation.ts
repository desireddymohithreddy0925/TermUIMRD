import { useState, useEffect, useRef } from '../hooks.js';
import { animateSpring } from '@termuijs/motion';
import type { SpringPresetName, SpringConfig } from '@termuijs/motion';

export interface UseAnimationConfig {
    type?: 'spring';
    preset?: SpringPresetName;
    config?: Partial<SpringConfig>;
}

/**
 * Hook to animate a value smoothly using spring physics.
 * @param targetValue The value to animate towards.
 * @param options Configuration for the spring physics.
 * @returns The current interpolated value.
 */
export function useAnimation(
    targetValue: number,
    options: UseAnimationConfig = {}
): number {
    const [currentValue, setCurrentValue] = useState(targetValue);
    
    // Keep track of the current animated value so we don't restart from 0
    // if the target changes mid-animation
    const animatedValueRef = useRef(targetValue);

    useEffect(() => {
        const from = animatedValueRef.current;
        const to = targetValue;

        if (from === to) return;

        const config = options.config || options.preset || 'default';

        const stop = animateSpring(
            from,
            to,
            config,
            (value) => {
                animatedValueRef.current = value;
                setCurrentValue(value);
            }
        );

        return () => stop();
    }, [targetValue, options.preset, options.config]);

    return currentValue;
}
