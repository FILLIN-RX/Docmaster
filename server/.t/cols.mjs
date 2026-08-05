import pool from '/home/ruxel/Docmaster-web/server/src/database/db.js';
const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='declarations' ORDER BY ordinal_position");
console.log(r.rows.map(x=>x.column_name).join(', '));
process.exit(0);
