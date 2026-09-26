import React from 'react';

const ITEMS = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        icon: '▦'
    },
    {
        key: 'issues',
        label: 'Issues',
        icon: '◉'
    },
    {
        key: 'agents',
        label: 'AI Agents',
        icon: '⬡'
    },
    {
        key: 'pulls',
        label: 'Pull Requests',
        icon: '⇄'
    },
    {
        key: 'deployments',
        label: 'Deployments',
        icon: '🚀'
    },
    {
        key: 'audit',
        label: 'Audit Trail',
        icon: '📜'
    }
];

export default function Sidebar({
                                    active,
                                    onSelect
                                }) {

    return (
        <aside className="w-56 shrink-0 bg-panel border-r border-edge flex flex-col">
            <div className="px-5 py-5 border-b border-edge">
                <div className="text-lg font-semibold tracking-tight">
                    Enterprise Copilot
                </div>
                <div className="text-xs text-slate-400 mt-1">
                    Every sprint has AI teammates
                </div>
            </div>
            <nav className="flex-1 py-3">
                {ITEMS.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => onSelect(item.key)}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                            active === item.key
                                ? 'bg-panel2 text-white border-l-2 border-accent'
                                : 'text-slate-400 hover:text-slate-200 border-l-2 border-transparent'
                        }`}
                    >

                        <span className="w-4 text-center">
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="px-5 py-4 border-t border-edge text-[11px] text-slate-500">
                AI accelerates delivery.<br />
                Humans own accountability.
            </div>
        </aside>
    );
}
