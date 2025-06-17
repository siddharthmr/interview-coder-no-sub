import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const randomNames: string[] = [
  'Text Editor',
  'File Manager',
  'System Utility',
  'Document Viewer',
  'Media Player',
  'Archive Tool',
  'Network Tool',
  'System Monitor',
  'Task Manager',
  'Process Viewer',
  'File Browser',
  'System Helper',
  'Data Manager',
  'Service Tool',
  'Background Helper',
  'System Service',
  'File Sync',
  'Data Sync',
  'Update Helper',
  'System Agent'
];

const randomAppIds: string[] = [
  'com.script.editor',
  'com.text.editor',
  'com.file.manager',
  'com.system.utility',
  'com.document.viewer',
  'com.media.player',
  'com.archive.tool',
  'com.network.tool',
  'com.system.monitor',
  'com.task.manager',
  'com.process.viewer',
  'com.file.browser',
  'com.system.helper',
  'com.data.manager',
  'com.service.tool',
  'com.background.helper',
  'com.system.service',
  'com.file.sync',
  'com.data.sync',
  'com.update.helper',
  'com.system.agent'
];

interface BuildConfig {
  productName: string;
  appId: string;
  mac?: {
    artifactName: string;
    [key: string]: any;
  };
  win?: {
    artifactName: string;
    [key: string]: any;
  };
  linux?: {
    artifactName: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface PackageJson {
  build: BuildConfig;
  [key: string]: any;
}

interface RandomizedConfig {
  randomProductName: string;
  randomAppId: string;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomString(length: number = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomizeBuildConfig(): RandomizedConfig {
  const packagePath = join(__dirname, '../package.json');
  const packageData: PackageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  const baseProductName = getRandomElement(randomNames);
  const baseAppId = getRandomElement(randomAppIds);
  const randomSuffix = generateRandomString(3);
  
  const randomProductName = baseProductName;
  const randomAppId = `${baseAppId}.${randomSuffix}`;
  
  packageData.build.productName = randomProductName;
  packageData.build.appId = randomAppId;
  
  if (packageData.build.mac) {
    packageData.build.mac.artifactName = `${randomProductName.replace(/\s+/g, '-')}-\${arch}.\${ext}`;
  }
  if (packageData.build.win) {
    packageData.build.win.artifactName = `${randomProductName.replace(/\s+/g, '-')}-Windows-\${version}.\${ext}`;
  }
  if (packageData.build.linux) {
    packageData.build.linux.artifactName = `${randomProductName.replace(/\s+/g, '-')}-Linux-\${version}.\${ext}`;
  }
  
  writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
  
  console.log(`   Product Name: ${randomProductName}`);
  console.log(`   App ID: ${randomAppId}`);
  
  return { randomProductName, randomAppId };
}

function main(): void {
  const config = randomizeBuildConfig();
  
  console.log(`Process name will be: "${config.randomProductName}"`);
  console.log(`App ID will be: "${config.randomAppId}"`);
}

if (require.main === module) {
  main();
}

export { randomizeBuildConfig }; 
