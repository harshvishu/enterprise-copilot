// Ranges are zero-based and end-exclusive. Each displayed row retains its
// snapshot line number; omitted source is never numbered as Java code.
export function sourceRows(source, ranges) {
    const lines = source.trimEnd().split('\n');
    const rows = [];
    let previousEnd = ranges[0][0];
    for (const [start, end] of ranges) {
        if (start > previousEnd) rows.push({ omitted: `Lines ${previousEnd + 1}–${start} omitted` });
        for (let index = start; index < end; index++) rows.push({ text: lines[index], number: index + 1 });
        previousEnd = end;
    }
    const indent = Math.min(...rows.filter(row => row.text?.trim()).map(row => row.text.match(/^ */)[0].length));
    return rows.map(row => row.text === undefined ? row : { ...row, text: row.text.slice(indent) });
}

export function enclosingMethod(source, start) {
    const lines = source.split('\n');
    let header = start;
    while (header > 0 && !/^\s*(public|private|protected)\s+.*\(/.test(lines[header])) header--;
    let end = header + 1;
    while (end < lines.length && !lines[end - 1].includes('{')) end++;
    return [header, end];
}
