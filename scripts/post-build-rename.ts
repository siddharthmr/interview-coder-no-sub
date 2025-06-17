import { existsSync, readdirSync, statSync, renameSync } from 'fs';
import { join, extname } from 'path';

const randomExecutableNames: string[] = [
  'tool',
  'util',
  'app',
  'service',
  'worker',
  'daemon',
  'client',
  'manager'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function renameExecutables(): string | undefined {
  const releaseDir = join(__dirname, '../release');
  
  if (!existsSync(releaseDir)) {
    return;
  }
  
  const randomName = getRandomElement(randomExecutableNames);
  const randomSuffix = generateRandomString(4);
  const newExecutableName = `${randomName}-${randomSuffix}`;
  
  console.log(`🔄 Renaming executables to: ${newExecutableName}`);
  
  const files = readdirSync(releaseDir);
  
  files.forEach((file: string) => {
    const filePath = join(releaseDir, file);
    const stats = statSync(filePath);
    
    if (stats.isFile()) {
      if (file.endsWith('.dmg')) {
        const newName = file.replace(/^[^-]+-/, `${newExecutableName}-`);
        const newPath = join(releaseDir, newName);
        renameSync(filePath, newPath);
      }
      else if (file.endsWith('.exe') || file.endsWith('.msi')) {
        const ext = extname(file);
        const newName = `${newExecutableName}${ext}`;
        const newPath = join(releaseDir, newName);
        renameSync(filePath, newPath);
      }
      else if (file.endsWith('.AppImage') || file.endsWith('.deb') || file.endsWith('.rpm')) {
        const ext = extname(file);
        const newName = `${newExecutableName}${ext}`;
        const newPath = join(releaseDir, newName);
        renameSync(filePath, newPath);
      }
    }
  });
  
  return newExecutableName;
}

function main(): void {
  renameExecutables();
}

if (require.main === module) {
  main();
}

export { renameExecutables }; 
