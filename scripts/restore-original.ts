import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface OriginalConfig {
  productName: string;
  appId: string;
  mac: {
    artifactName: string;
  };
  win: {
    artifactName: string;
  };
  linux: {
    artifactName: string;
  };
}

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

const originalConfig: OriginalConfig = {
  productName: "Interview Coder",
  appId: "com.chunginlee.interviewcoder",
  mac: {
    artifactName: "Interview-Coder-${arch}.${ext}"
  },
  win: {
    artifactName: "${productName}-Windows-${version}.${ext}"
  },
  linux: {
    artifactName: "${productName}-Linux-${version}.${ext}"
  }
};

function restoreOriginalConfig(): void {
  const packagePath = join(__dirname, '../package.json');
  const packageData: PackageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  packageData.build.productName = originalConfig.productName;
  packageData.build.appId = originalConfig.appId;
  
  if (packageData.build.mac) {
    packageData.build.mac.artifactName = originalConfig.mac.artifactName;
  }
  if (packageData.build.win) {
    packageData.build.win.artifactName = originalConfig.win.artifactName;
  }
  if (packageData.build.linux) {
    packageData.build.linux.artifactName = originalConfig.linux.artifactName;
  }
  
  writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
}

function main(): void {
  console.log('🔄 Restoring original build configuration...');
  restoreOriginalConfig();
  console.log('✨ Original configuration restored!');
}

if (require.main === module) {
  main();
}

export { restoreOriginalConfig }; 
