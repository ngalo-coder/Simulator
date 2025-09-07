import fs from 'fs';
import path from 'path';

const searchDir = './simulatorfrontend/src';

const regex = /import\s+\{[^}]*api[^}]*\}\s+from\s+['"]\.\.\/services\/apiService['"]/;
const replacement = 'import { apiService } from \'../services/apiService\';';

function replaceInFile(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return;
    }

    if(regex.test(data)) {
        const result = data.replace(/import\s+\{[^}]*api[^}]*\}\s+from\s+['"]\.\.\/services\/apiService['"]/g, replacement).replace(/api\./g, 'apiService.');

        fs.writeFile(filePath, result, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing file ${filePath}:`, err);
            } else {
                console.log(`Successfully updated ${filePath}`);
            }
        });
    }
  });
}

function traverseDir(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }

    files.forEach((file) => {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        traverseDir(fullPath);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        replaceInFile(fullPath);
      }
    });
  });
}

traverseDir(searchDir);