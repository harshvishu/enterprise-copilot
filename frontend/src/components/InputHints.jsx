import React from 'react';

export default function InputHints({ suggestions, onSelect, disabled }) {
    return (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Suggested answers">
            {suggestions.map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    disabled={disabled}
                    className="max-w-full break-anywhere text-left text-xs text-primary underline underline-offset-4 disabled:opacity-50"
                    onClick={() => onSelect(suggestion)}
                    aria-label={`Use suggestion: ${suggestion}`}
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
}