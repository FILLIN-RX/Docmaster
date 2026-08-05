import pool from '/home/ruxel/Docmaster-web/server/src/database/db.js';
const r = await pool.query("SELECT email, prenom, nom, niveau, ville, is_active FROM autorites ORDER BY created_at DESC LIMIT 10");
console.log('count:', r.rows.length);
for (const x of r.rows) console.log(' -', x.email, x.niveau, x.ville, 'active:', x.is_active);
process.exit(0);
