import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  config = {};
}

// Map of environment variables (from AI Studio Environment Variables settings) to JSON properties
const mappings = {
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_APP_ID: 'appId',
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_FIRESTORE_DATABASE_ID: 'firestoreDatabaseId',
  VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  VITE_FIREBASE_MEASUREMENT_ID: 'measurementId'
};

let updated = false;
for (const [envKey, jsonKey] of Object.entries(mappings)) {
  if (process.env[envKey]) {
    if (envKey === 'VITE_FIREBASE_FIRESTORE_DATABASE_ID' && process.env[envKey] === '(default)') {
      console.log(`Skipping VITE_FIREBASE_FIRESTORE_DATABASE_ID because it has the generic value '(default)'.`);
      continue;
    }
    config[jsonKey] = process.env[envKey];
    updated = true;
  }
}

if (updated) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log('Successfully updated firebase-applet-config.json with environment variables!');
} else {
  console.log('No starting VITE_FIREBASE_ environment variables found, firebase-applet-config.json left unchanged.');
}
