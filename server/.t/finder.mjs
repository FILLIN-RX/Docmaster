import pg from 'pg';
import 'dotenv/config';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL || process.env.DATABASE_STRING });
await client.connect();
const q = `
  SELECT d.id, d.declaration_type, d.status, d.owner_name,
    u.nom AS reporter_nom, u.prenom AS reporter_prenom,
    (SELECT CONCAT(fu.prenom,' ',fu.nom) FROM matches m
     LEFT JOIN declarations fd ON fd.id = m.found_declaration_id
     LEFT JOIN users fu ON fu.id = fd.reporter_id
     WHERE m.lost_declaration_id = d.id AND m.status IN ('PENDING','CONFIRMED') LIMIT 1) AS finder_name
  FROM declarations d
  LEFT JOIN users u ON u.id = d.reporter_id
  ORDER BY d.created_at DESC`;
const r = await client.query(q);
console.log(JSON.stringify(r.rows, null, 1));
await client.end();
