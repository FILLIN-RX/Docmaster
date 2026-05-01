import pool from '../database/db.js';
import { DocumentDeclaration } from '../types/database.ts';

export class DeclarationRepository {
  /**
   * Create a new declaration
   */
  async create(data: Partial<DocumentDeclaration>): Promise<DocumentDeclaration> {
    const query = `
      INSERT INTO declarations (
        identifiant_doc_dm, doc_type, owner_name, document_number, 
        declaration_type, status, reporter_id, ville, region, pays, 
        fingerprint, found_location, etat_physique, photo_recto, 
        photo_verso, description, date_expiration, mode_contact, 
        payment_status, date_naissance, urgence_niveau, recompense_montant, date_perte
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `;

    const values = [
      data.identifiant_doc_dm,
      data.doc_type,
      data.owner_name,
      data.document_number,
      data.declaration_type,
      data.status || 'AVAILABLE',
      data.reporter_id,
      data.ville,
      data.region,
      data.pays,
      data.fingerprint,
      data.found_location ? JSON.stringify(data.found_location) : null,
      data.etat_physique,
      data.photo_recto,
      data.photo_verso,
      data.description,
      data.date_expiration || null,
      data.mode_contact || 'APP_CHAT',
      data.payment_status || 'PENDING',
      data.date_naissance || null,
      data.urgence_niveau || 'Modérée',
      data.recompense_montant || 0,
      data.date_perte || null
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * Find declarations by reporter ID
   */
  async findByReporterId(reporterId: string): Promise<DocumentDeclaration[]> {
    const query = 'SELECT * FROM declarations WHERE reporter_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [reporterId]);
    return rows;
  }

  /**
   * Find all available declarations (for search)
   */
  async findAllAvailable(): Promise<DocumentDeclaration[]> {
    const query = "SELECT * FROM declarations WHERE status = 'AVAILABLE' ORDER BY created_at DESC";
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<DocumentDeclaration | null> {
    const query = 'SELECT * FROM declarations WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Update status
   */
  async updateStatus(id: string, status: string): Promise<DocumentDeclaration | null> {
    const query = 'UPDATE declarations SET status = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, id]);
    return rows[0] || null;
  }

  /**
   * Count declarations for a specific year and month
   */
  async countByMonth(year: number, month: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM declarations 
      WHERE EXTRACT(YEAR FROM created_at) = $1 
      AND EXTRACT(MONTH FROM created_at) = $2
    `;
    const { rows } = await pool.query(query, [year, month]);
    return parseInt(rows[0].count);
  }

  /**
   * Find by fingerprint
   */
  async findByFingerprint(fingerprint: string): Promise<DocumentDeclaration[]> {
    const query = 'SELECT * FROM declarations WHERE fingerprint = $1 AND status != \'RETURNED\'';
    const { rows } = await pool.query(query, [fingerprint]);
    return rows;
  }

  /**
   * Search declarations with filters
   */
  async search(filters: any): Promise<DocumentDeclaration[]> {
    let query = 'SELECT * FROM declarations WHERE status = \'AVAILABLE\'';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.doc_type) {
      query += ` AND doc_type = $${paramIndex++}`;
      values.push(filters.doc_type);
    }

    if (filters.ville) {
      query += ` AND ville ILIKE $${paramIndex++}`;
      values.push(`%${filters.ville}%`);
    }

    if (filters.declaration_type) {
      query += ` AND declaration_type = $${paramIndex++}`;
      values.push(filters.declaration_type);
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, values);
    return rows;
  }

  /**
   * Update a declaration
   */
  async update(id: string, reporterId: string, data: Partial<DocumentDeclaration>): Promise<DocumentDeclaration | null> {
    const query = `
      UPDATE declarations 
      SET 
        doc_type = COALESCE($1, doc_type),
        owner_name = COALESCE($2, owner_name),
        document_number = COALESCE($3, document_number),
        status = COALESCE($4, status),
        ville = COALESCE($5, ville),
        region = COALESCE($6, region),
        pays = COALESCE($7, pays),
        description = COALESCE($8, description),
        etat_physique = COALESCE($9, etat_physique),
        recompense_montant = COALESCE($10, recompense_montant),
        urgence_niveau = COALESCE($11, urgence_niveau)
      WHERE id = $12 AND reporter_id = $13
      RETURNING *`;

    const { rows } = await pool.query(query, [
      data.doc_type,
      data.owner_name,
      data.document_number,
      data.status,
      data.ville,
      data.region,
      data.pays,
      data.description,
      data.etat_physique,
      data.recompense_montant,
      data.urgence_niveau,
      id,
      reporterId
    ]);

    return rows[0] || null;
  }
}
