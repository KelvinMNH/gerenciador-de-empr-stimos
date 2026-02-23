import fs from 'fs';
const lines = fs.readFileSync('src/app.component.html', 'utf8').split('\n');

lines.forEach((line, i) => {
    const open = (line.match(/{{/g) || []).length;
    const close = (line.match(/}}/g) || []).length;
    if (open !== close) {
        console.log(`Line ${i + 1} imbalance: ${line.trim()}`);
    }
});

let depth = 0;
lines.forEach((line, i) => {
    // Naively track depth for @if, @for, etc
    // Ignore { inside {{ }} (simplified)
    const cleanLine = line.replace(/{{.*?}}/g, '');
    const opens = (cleanLine.match(/{/g) || []).length;
    const closes = (cleanLine.match(/}/g) || []).length;
    depth += opens - closes;
    if (depth < 0) console.log(`Negative depth at line ${i + 1}: ${line.trim()}`);
});
console.log('Final depth:', depth);
