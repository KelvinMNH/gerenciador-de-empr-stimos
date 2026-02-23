import fs from 'fs';
const content = fs.readFileSync('src/app.component.html', 'utf8');

const openDivs = (content.match(/<div\b/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;

console.log(`Open divs: ${openDivs}`);
console.log(`Close divs: ${closeDivs}`);

const openIf = (content.match(/@if/g) || []).length;
const closeBrace = (content.match(/^\s*}\s*$/gm) || []).length;
// Note: checking '}' is harder because of JS inside templates. 
// But we mostly care about block closers which are usually on their own line or at end of line.

console.log(`@if count: ${openIf}`);
// Simple check for braces balance in the whole file might be noisy but useful
const totalOpenB = (content.match(/{/g) || []).length;
const totalCloseB = (content.match(/}/g) || []).length;
console.log(`Total { : ${totalOpenB}`);
console.log(`Total } : ${totalCloseB}`);
