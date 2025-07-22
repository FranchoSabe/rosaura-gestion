import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

if (process.argv.length < 3) {
  console.error('Usage: node removeOrderIdField.js <serviceAccountKey.json>');
  process.exit(1);
}

const serviceAccountPath = process.argv[2];
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const snapshot = await db.collection('pedidos').get();
  let updated = 0;
  await Promise.all(
    snapshot.docs.map(doc => {
      if (doc.data().id !== undefined) {
        updated++;
        return doc.ref.update({ id: FieldValue.delete() });
      }
      return Promise.resolve();
    })
  );
  console.log(`Removed id field from ${updated} documents.`);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
