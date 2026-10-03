import React from 'react';
import {
    Layers2,
    LayoutDashboard,
    CircleDot,
    Bot,
    GitPullRequest,
    Rocket,
    History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'issues', label: 'Issues', icon: CircleDot },
    { key: 'agents', label: 'Agents', icon: Bot },
    { key: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
    { key: 'deployments', label: 'Deployments', icon: Rocket },
    { key: 'audit', label: 'Audit Trail', icon: History },
];

export default function Sidebar({ active, onSelect }) {
    return (
        <aside className="flex h-full min-h-[400px] w-full flex-col bg-card/40">
            <div className="flex items-center gap-2.5 px-5 py-7">
                <Layers2 className="h-5 w-5 shrink-0 text-foreground/80" />
                <span className="text-sm font-semibold">Enterprise Copilot</span>
            </div>
            <div className="mx-4 mb-7 flex items-center gap-2.5 border-b pb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted text-[10px] font-medium">
                    UB
                </div>
                <div>
                    <div className="text-xs font-medium">Ubuntu Bank</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                        Engineering workspace
                    </div>
                </div>
            </div>
            <nav aria-label="Main navigation" className="space-y-1 px-3">
                {ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Button
                            key={item.key}
                            variant="ghost"
                            aria-current={active === item.key ? 'page' : undefined}
                            onClick={() => onSelect(item.key)}
                            className={cn(
                                'h-9 w-full justify-start gap-3 px-3 text-xs font-normal',
                                active === item.key
                                    ? 'bg-accent/65 text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-4 w-4',
                                    active === item.key
                                        ? 'text-foreground/80'
                                        : 'text-muted-foreground/70',
                                )}
                            />
                            {item.label}
                        </Button>
                    );
                })}
            </nav>
            <div className="mt-auto px-5 py-6 text-[10px] leading-5 text-muted-foreground/65">
                AI accelerates delivery.
                <br />
                Humans own accountability.
            </div>
        </aside>
    );
}
