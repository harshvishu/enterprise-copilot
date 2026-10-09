import React from 'react';
import { Button } from '@/components/ui/button';

export default function InputHints({ suggestions, onSelect, disabled }) {
    return (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested answers">
            {suggestions.map((suggestion) => (
                <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="h-auto min-h-8 max-w-full whitespace-normal text-left text-xs"
                    onClick={() => onSelect(suggestion)}
                    aria-label={`Use suggestion: ${suggestion}`}
                >
                    {suggestion}
                </Button>
            ))}
        </div>
    );
}