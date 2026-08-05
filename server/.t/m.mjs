import argon2 from 'argon2';
import pool from '/home/ruxel/Docmaster-web/server/src/database/db.js';
const r = await pool.query("SELECT email, prenom, nom, mot_de_passe FROM autorites WHERE email='djeutchouruxel@gmail.com'");
if (!r.rows[0]) { console.log('user absent'); process.exit(0); }
for (const c of ['TempPass123','NouveauPass456','HautePass123','12345678']) {
  try { if (await argon2.verify(r.rows[0].mot_de_passe, c)) console.log('MD=', c); } catch {}
}
process.exit(0);
