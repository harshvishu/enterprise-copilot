import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';

export const SlideNavigationContext = createContext(null);

// Each slide declares its initial/final state; the presenter owns navigation.
export function useSlideState(initial, final) {
    const [value, setValue] = useState(initial);
    const navigation = useContext(SlideNavigationContext);
    const setState = useCallback(next => setValue(current => Math.max(initial, Math.min(final, typeof next === 'function' ? next(current) : next))), [initial, final]);
    useLayoutEffect(() => {
        if (!navigation?.active) return undefined;
        return navigation.register(navigation.index, { value, initial, final, setState });
    }, [navigation, value, initial, final, setState]);
    return [value, setState];
}
