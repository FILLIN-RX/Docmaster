import pool from '/home/ruxel/Docmaster-web/server/src/database/db.js';
import { PdfService } from '/home/ruxel/Docmaster-web/server/src/services/pdf.service.ts';
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';
(async () => {
  const { rows } = await pool.query("SELECT * FROM declarations ORDER BY created_at DESC LIMIT 1");
  const d = rows[0];
  console.log('Décl:', d.identifiant_doc_dm, d.owner_name, 'certified:', d.is_certified, 'ville:', d.ville);
  const svc = new PdfService();
  const pt = new PassThrough();
  const out = createWriteStream('/tmp/pdf_v3.pdf');
  pt.pipe(out);
  await svc.generateDeclarationPdf(d, pt);
  await new Promise(r => setTimeout(r, 500));
  console.log('OK');
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
