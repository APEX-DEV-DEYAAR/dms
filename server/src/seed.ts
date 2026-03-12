import fs from 'fs';
import path from 'path';
import { config } from './config';
import { createDBAdapter } from './db';

async function seed() {
  const db = createDBAdapter();
  await db.connect();

  const seedsDir = path.resolve(__dirname, '../../database/seeds');
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf-8');
    await db.execute(sql);
    console.log(`Seed applied: ${file}`);
  }

  await db.disconnect();
  console.log('Seeding complete');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
