import fs from 'fs';
const content = fs.readFileSync('src/app.component.html', 'utf8');

// Basic counts
const openDivs = (content.match(/<div\b/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
console.log(`Divs: ${openDivs} open vs ${closeDivs} close`);

const openIf = (content.match(/@if/g) || []).length;
const closeBrace = (content.match(/^\s*}\s*$/gm) || []).length;
// This simple regex for } misses braces with spaces, etc.
// Better count total braces?
const totalOpen = (content.match(/{/g) || []).length;
const totalClose = (content.match(/}/g) || []).length;
console.log(`Braces: ${totalOpen} { vs ${totalClose} }`);

// Line by line depth check for braces (approximate)
const lines = content.split('\n');
let depth = 0;
lines.forEach((line, i) => {
    // Remove interpolation contents to avoid counting {{ }} as depth
    let clean = line.replace(/{{.*?}}/g, '');
    let open = (clean.match(/{/g) || []).length;
    let close = (clean.match(/}/g) || []).length;
    depth += open - close;
    if (depth < 0) {
        console.log(`Negative brace depth at line ${i + 1}: ${line.trim()}`);
    }
});
console.log(`Final brace depth: ${depth}`);
