/**
 * Script para inyectar variables de entorno de .env a Angular (environment.ts)
 * Se ejecuta automáticamente antes de 'npm start' y 'npm run build'.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envExamplePath = path.resolve(__dirname, '../.env.example');
const targetDir = path.resolve(__dirname, '../src/environments');
const targetFileProd = path.resolve(targetDir, 'environment.ts');
const targetFileDev = path.resolve(targetDir, 'environment.development.ts');
const targetFileExample = path.resolve(targetDir, 'environment.example.ts');

// Asegurar que el directorio de environments exista
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Función sencilla para parsear archivo .env
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        result[key] = val;
      }
    }
  });
  return result;
}

const envVars = parseEnv(envPath);

// Prioridad: 1. process.env (para CI/CD o Hosting), 2. archivo .env local, 3. valores dummy
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || envVars.FIREBASE_API_KEY || 'AIzaSy_YOUR_API_KEY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || envVars.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || envVars.FIREBASE_PROJECT_ID || 'your-project',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || envVars.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || envVars.FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.FIREBASE_APP_ID || envVars.FIREBASE_APP_ID || '1:1234567890:web:abcdef',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || envVars.FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
};

const fileContent = (isProduction) => `// Archivo generado automáticamente por scripts/set-env.js
// NO MODIFICAR MANUALMENTE NI SUBIR A CONTROL DE VERSIONES (IGNORADO EN .gitignore)

export const environment = {
  production: ${isProduction},
  firebase: {
    apiKey: "${firebaseConfig.apiKey}",
    authDomain: "${firebaseConfig.authDomain}",
    projectId: "${firebaseConfig.projectId}",
    storageBucket: "${firebaseConfig.storageBucket}",
    messagingSenderId: "${firebaseConfig.messagingSenderId}",
    appId: "${firebaseConfig.appId}",
    measurementId: "${firebaseConfig.measurementId}"
  }
};
`;

const exampleContent = `// Plantilla pública de ejemplo (SÍ se puede subir a GitHub)

export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
    measurementId: "G-XXXXXXXXXX"
  }
};
`;

// Escribir los archivos
fs.writeFileSync(targetFileProd, fileContent(true), 'utf-8');
fs.writeFileSync(targetFileDev, fileContent(false), 'utf-8');
fs.writeFileSync(targetFileExample, exampleContent, 'utf-8');

console.log('✅ [set-env] Configuración de Firebase inyectada exitosamente en src/environments/environment.ts');
