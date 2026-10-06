import React, { useCallback, useMemo, useState } from 'react';
import { SlideNavigationContext } from './slide-navigation';

export default function NavigationTestHarness({ children }) {
    const [state, setState] = useState(null);
    const register = useCallback((index, next) => { setState(next); }, []);
    const navigation = useMemo(() => ({ active: true, index: 0, register }), [register]);
    return <SlideNavigationContext.Provider value={navigation}>{children}
        <button disabled={!state || state.value === state.initial} onClick={() => state.setState(value => value - 1)}>Prev</button>
        <button disabled={!state || state.value === state.final} onClick={() => state.setState(value => value + 1)}>Next</button>
        <span role="status">{state?.value} / {state?.final}</span>
    </SlideNavigationContext.Provider>;
}
