import React, { useState } from 'react';
import { ChevronDown, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

export default function DiffViewer({ diff, defaultOpen = false }) {
    const [selected, setSelected] = useState('all');
    if (!diff) return <p className="text-sm text-muted-foreground">No code proposal yet.</p>;
    const files = diff.split(/(?=^diff --git )/m).filter(Boolean);
    const visible = selected === 'all' ? diff : files[Number(selected)] || diff;
    return (
        <Collapsible defaultOpen={defaultOpen} className="min-w-0 rounded-md border">
            <div className="flex min-w-0 items-center justify-between gap-2 bg-card px-3 py-2">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="group -ml-1">
                        <FileCode2 />
                        Proposed diff
                        <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                    </Button>
                </CollapsibleTrigger>
                {files.length > 1 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="max-w-[45%] text-muted-foreground"
                            >
                                <span className="truncate">
                                    {selected === 'all'
                                        ? 'All files'
                                        : files[Number(selected)]
                                              ?.match(/^diff --git a\/(.+) b\/(.+)$/m)?.[2]
                                              ?.split('/')
                                              .pop()}
                                </span>
                                <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-w-[calc(100vw-2rem)]">
                            <DropdownMenuRadioGroup value={selected} onValueChange={setSelected}>
                                <DropdownMenuRadioItem value="all">All files</DropdownMenuRadioItem>
                                {files.map((file, index) => (
                                    <DropdownMenuRadioItem
                                        key={index}
                                        value={String(index)}
                                        className="max-w-80 break-anywhere font-mono text-xs"
                                    >
                                        {file.match(/^diff --git a\/(.+) b\/(.+)$/m)?.[2] ||
                                            `File ${index + 1}`}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            <CollapsibleContent>
                <ScrollArea className="h-80 w-full max-w-full border-t bg-background">
                    <pre className="m-0 w-max min-w-full py-3 font-mono text-[11px] leading-6">
                        {visible.split('\n').map((line, index) => (
                            <div
                                key={index}
                                className={
                                    line.startsWith('+') && !line.startsWith('+++')
                                        ? 'diff-line-add'
                                        : line.startsWith('-') && !line.startsWith('---')
                                          ? 'diff-line-remove'
                                          : /^(diff|---|\+\+\+|@@|index)/.test(line)
                                            ? 'diff-line-meta'
                                            : 'text-foreground/80'
                                }
                            >
                                <span
                                    aria-hidden="true"
                                    className="inline-block w-12 select-none pr-4 text-right text-muted-foreground/40"
                                >
                                    {index + 1}
                                </span>
                                <span className="pr-6">{line || ' '}</span>
                            </div>
                        ))}
                    </pre>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CollapsibleContent>
        </Collapsible>
    );
}
