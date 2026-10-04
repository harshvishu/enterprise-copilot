import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './theme-provider';

const OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const current = OPTIONS.find((option) => option.value === theme) || OPTIONS[1];
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Theme: ${current.label}`}
                    className="-ml-2 h-8 gap-2 px-2 text-xs font-normal text-muted-foreground"
                >
                    <current.icon className="h-4 w-4" />
                    {current.label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    {OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            className="gap-2"
                        >
                            <option.icon className="h-4 w-4" />
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
