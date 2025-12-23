const fs = require('fs');
try {
    const content = fs.readFileSync('polar_debug_output.txt', 'utf8');
    // Filter out the failure lines to reduce noise
    const lines = content.split('\n');
    lines.forEach(line => {
        if (line.includes('PRODUCT') || line.includes('PRICE ID') || line.includes('PAY WHAT YOU WANT')) {
            console.log(line.trim());
        }
    });
} catch (e) { console.error(e); }
