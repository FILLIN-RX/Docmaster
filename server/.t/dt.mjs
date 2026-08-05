import pg from 'pg';
import 'dotenv/config';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL || process.env.DATABASE_STRING });
await client.connect();
const r = await client.query("SELECT declaration_type, status, count(*) FROM declarations GROUP BY 1,2");
console.log(JSON.stringify(r.rows, null, 1));
await client.end();
