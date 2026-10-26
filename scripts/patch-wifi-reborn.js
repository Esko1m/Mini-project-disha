const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-wifi-reborn',
  'android',
  'build.gradle'
);

if (!fs.existsSync(file)) {
  process.exit(0);
}

let source = fs.readFileSync(file, 'utf8');
const original = source;

source = source
  .replace(
    'compileSdkVersion safeExtGet(compileSdkVersion, 31)',
    "compileSdk safeExtGet('compileSdkVersion', 31)"
  )
  .replace(
    'minSdkVersion safeExtGet(minSdkVersion, 21)',
    "minSdkVersion safeExtGet('minSdkVersion', 21)"
  )
  .replace(
    'targetSdkVersion safeExtGet(targetSdkVersion, 31)',
    "targetSdkVersion safeExtGet('targetSdkVersion', 31)"
  )
  .replace(
    "implementation 'com.facebook.react:react-native:+'",
    "implementation 'com.facebook.react:react-android'"
  )
  .replace(/\nbuildscript \{[\s\S]*?\n\}\n/, '\n');

if (!source.includes("compileSdk safeExtGet('compileSdkVersion'")) {
  console.error('Could not patch react-native-wifi-reborn for AGP 9.');
  process.exit(1);
}

if (source !== original) {
  fs.writeFileSync(file, source);
}
