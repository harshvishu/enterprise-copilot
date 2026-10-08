import React from 'react';
import { FileCode2 } from 'lucide-react';

// Small Java lexer: React renders every token as text, never as injected HTML.
function JavaLine({ text }) {
    const tokens = text.split(/("(?:\\.|[^"\\])*"|\/\/.*$|\b(?:public|private|return|try|catch|throw|new|class|final|void)\b|\b[A-Z][A-Za-z0-9_]*\b)/g);
    return tokens.map((token, index) => {
        const type = token.startsWith('//') ? 'comment' : token.startsWith('"') ? 'string' : /^(public|private|return|try|catch|throw|new|class|final|void)$/.test(token) ? 'keyword' : /^[A-Z]/.test(token) ? 'type' : '';
        return <span key={index} className={type ? `syntax-${type}` : undefined}>{token}</span>;
    });
}

export default function CodeSlide({ file, lines = [], rows, startLine = 1, highlight = [], annotation }) {
    const sourceRows = rows ?? lines.map((text, index) => ({ text, number: startLine + index }));
    return (
        <figure className="code-workspace">
            <figcaption className="code-file"><FileCode2 size={18} /><span>{file}</span><span className="code-language">JAVA</span></figcaption>
            <pre tabIndex={0} aria-label={`${file} source excerpt`}><code>
                {sourceRows.map(({ text: line, number, omitted }, index) => {
                    if (omitted) return <span key={`gap-${index}`} className="source-line source-omission"><span className="line-number" aria-hidden="true">···</span><span>{omitted}</span></span>;
                    const selected = highlight.includes(number);
                    return <span key={number} className={`source-line ${!line.trim() ? 'source-blank' : ''} ${selected ? 'highlighted' : highlight.length ? 'dimmed' : ''}`}><span className="line-number" aria-hidden="true">{number}</span><span><JavaLine text={line} /></span></span>;
                })}
            </code></pre>
            {annotation && <div className="code-annotation"><span className="signal-dot" />{annotation}</div>}
        </figure>
    );
}
