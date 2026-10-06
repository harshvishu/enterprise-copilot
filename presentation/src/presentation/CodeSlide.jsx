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

export default function CodeSlide({ file, lines, startLine = 1, highlight = [], annotation }) {
    return (
        <figure className="code-workspace">
            <figcaption className="code-file"><FileCode2 size={18} /><span>{file}</span><span className="code-language">JAVA</span></figcaption>
            <pre tabIndex={0} aria-label={`${file} source excerpt`}><code>
                {lines.map((line, index) => {
                    const number = startLine + index;
                    const selected = highlight.includes(number);
                    return <span key={number} className={`source-line ${selected ? 'highlighted' : highlight.length ? 'dimmed' : ''}`}><span className="line-number" aria-hidden="true">{number}</span><span><JavaLine text={line} /></span></span>;
                })}
            </code></pre>
            {annotation && <div className="code-annotation"><span className="signal-dot" />{annotation}</div>}
        </figure>
    );
}
