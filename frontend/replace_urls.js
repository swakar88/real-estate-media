const fs = require('fs');
const path = require('path');

const directory = 'c:/Dev/Krishna/real-estate-media/frontend/src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(directory);
const searchString = 'http://127.0.0.1:8000';
// We use a constant, or we can just replace the string literal.
// But some places use template literals `http://127.0.0.1:8000/api/...`
// We'll replace the exact substring but ensure it's concatenated or in a template literal correctly.

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(searchString)) {
        // Find if it's in a string like "http://127.0.0.1:8000/api/..."
        // Or in a template literal `http://127.0.0.1:8000/api/${id}`
        // We can just replace the 'http://127.0.0.1:8000' part with ${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}
        // BUT if it's in double quotes "http...", we need to convert it to template literal.
        
        let newContent = content.replace(/"http:\/\/127\.0\.0\.1:8000([^"]*)"/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}$1`');
        newContent = newContent.replace(/'http:\/\/127\.0\.0\.1:8000([^']*)'/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}$1`');
        
        // Handle existing template literals `http://127.0.0.1:8000/...`
        newContent = newContent.replace(/`http:\/\/127\.0\.0\.1:8000([^`]*)`/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}$1`');

        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
