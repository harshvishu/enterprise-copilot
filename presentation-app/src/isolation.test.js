// Guard the standalone app against accidental imports of sibling application code.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';

const appRoot = path.resolve(process.cwd()) + path.sep;
function files(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? files(file) : [file];
    });
}
it('resolves every local source import inside the standalone app', () => {
    for (const file of files(path.join(appRoot, 'src')).filter(file => /\.(jsx?|css)$/.test(file))) {
        const source = readFileSync(file, 'utf8');
        const imports = [...source.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
        for (const specifier of imports.filter(value => value.startsWith('.') || value.startsWith('@/'))) {
            const resolved = specifier.startsWith('@/')
                ? path.resolve(appRoot, 'src', specifier.slice(2))
                : path.resolve(path.dirname(file), specifier.split('?')[0]);
            expect(resolved.startsWith(appRoot), `${file} imports outside app: ${specifier}`).toBe(true);
        }
    }
});
