const fs = require('fs');

// Read the test file
let content = fs.readFileSync('src/lib/gitRepositoryDetector.test.ts', 'utf8');

// Replace mockExec.mockImplementation patterns with mockExecAsync.mockResolvedValue
content = content.replace(/mockExec\.mockImplementation\(\s*\([^)]*\)\s*=>\s*\{[^}]*if\s*\([^)]*callback[^)]*\)\s*\{[^}]*process\.nextTick\(\(\)\s*=>\s*callback\(null,\s*([^,]+),\s*([^)]+)\)\);?\s*\}[^}]*return[^}]*\}\s*\)/gs, 
  (match, stdout, stderr) => {
    return `mockExecAsync.mockResolvedValue({\n        stdout: ${stdout},\n        stderr: ${stderr},\n      })`;
  });

// Replace error callback patterns
content = content.replace(/mockExec\.mockImplementation\(\s*\([^)]*\)\s*=>\s*\{[^}]*if\s*\([^)]*callback[^)]*\)\s*\{[^}]*process\.nextTick\(\(\)\s*=>\s*callback\(([^,)]+)[^)]*\)\);?\s*\}[^}]*return[^}]*\}\s*\)/gs, 
  (match, error) => {
    return `mockExecAsync.mockRejectedValue(${error})`;
  });

// Write the fixed content back
fs.writeFileSync('src/lib/gitRepositoryDetector.test.ts', content);

console.log('Fixed mock patterns in test file');