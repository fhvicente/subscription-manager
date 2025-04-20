import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Diretório do banco de dados
const dbDir = path.join(__dirname, '../data');
const dbFile = path.join(dbDir, 'database.sqlite');
const backupDir = path.join(dbDir, 'backups');

// Certifique-se de que o diretório de backups existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Cria um nome para o arquivo de backup com timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `database-backup-${timestamp}.sqlite`);

// Verifica se o banco de dados existe
if (fs.existsSync(dbFile)) {
  // Faz backup do banco de dados atual
  console.log(`Creating backup of database at ${backupFile}`);
  fs.copyFileSync(dbFile, backupFile);
  console.log('Backup completed.');
  
  // Remove o banco de dados atual
  fs.unlinkSync(dbFile);
  console.log('Old database removed.');
}

// Executa o script de inicialização do banco de dados
console.log('Initializing new database...');
const result = spawnSync('node', ['../src/db/init.js'], { 
  stdio: 'inherit',
  cwd: __dirname
});

if (result.error) {
  console.error('Error initializing database:', result.error);
  process.exit(1);
}

console.log('Database refresh completed successfully!');
console.log(`A backup of your old database was created at: ${backupFile}`); 