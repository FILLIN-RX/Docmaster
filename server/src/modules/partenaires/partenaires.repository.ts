import pool from "../../database/db.js";

export interface PartenaireProfile {
  id: string;
  user_id: string;
  nom_organisation: string;
  adresse: string | null;
  logo_url: string | null;
  statut: 'ACTIF' | 'SUSPENDU' | 'INACTIF';
  must_change_password: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  // joined user fields
  email: string;
  telephone: string | null;
  nom_contact: string | null;
  prenom_contact: string | null;
  ville: string | null;
  region?: string | null;
  wallet_balance: number;
  is_verified: boolean;
}

const PROFILE_COLUMNS = `
  p.id, p.user_id, p.nom_organisation, p.adresse, p.logo_url,
  p.statut, p.must_change_password, p.created_by, p.created_at, p.updated_at,
  u.email, u.telephone, u.nom AS nom_contact, u.prenom AS prenom_contact,
  u.ville, u.wallet_balance, u.is_verified
`;

interface PartenaireCreateData {
  user_id: string;
  nom_organisation: string;
  adresse?: string;
  created_by?: string;
}

interface PartenaireUpdateData {
  nom_organisation?: string;
  adresse?: string;
  statut?: 'ACTIF' | 'SUSPENDU' | 'INACTIF';
}

export class PartenaireRepository {
  /**
   * Create the partenaire profile linked to an existing user
   */
  async create(data: PartenaireCreateData): Promise<PartenaireProfile> {
    await pool.query(
      `INSERT INTO partenaires (user_id, nom_organisation, adresse, created_by)
       VALUES ($1, $2, $3, $4)`,
      [data.user_id, data.nom_organisation, data.adresse || null, data.created_by || null]
    );
    return (await this.findByUserId(data.user_id))!;
  }

  /**
   * Find profile by user id (for auth middleware)
   */
  async findByUserId(userId: string): Promise<PartenaireProfile | null> {
    const query = `
      SELECT ${PROFILE_COLUMNS}
      FROM partenaires p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  /**
   * Find profile by email (for login)
   */
  async findByEmail(email: string): Promise<PartenaireProfile | null> {
    const query = `
      SELECT ${PROFILE_COLUMNS}
      FROM partenaires p
      JOIN users u ON u.id = p.user_id
      WHERE LOWER(u.email) = LOWER($1)
    `;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  }

  /**
   * Find profile by partenaire id
   */
  async findById(id: string): Promise<PartenaireProfile | null> {
    const query = `
      SELECT ${PROFILE_COLUMNS}
      FROM partenaires p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * List partners with pagination, search and status filter
   */
  async findAll(filters: {
    search?: string;
    statut?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rows: PartenaireProfile[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(`(p.nom_organisation ILIKE $${idx} OR u.email ILIKE $${idx} OR u.nom ILIKE $${idx} OR u.prenom ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    if (filters.statut) {
      conditions.push(`p.statut = $${idx++}`);
      params.push(filters.statut);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM partenaires p JOIN users u ON u.id = p.user_id ${where}`,
      params
    );
    const total = countRes.rows[0].total;

    const query = `
      SELECT ${PROFILE_COLUMNS}
      FROM partenaires p
      JOIN users u ON u.id = p.user_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const { rows } = await pool.query(query, [...params, limit, offset]);
    return { rows, total };
  }

  /**
   * Update the partenaire profile
   */
  async update(id: string, data: PartenaireUpdateData): Promise<PartenaireProfile | null> {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const fields: Record<string, any> = {
      nom_organisation: data.nom_organisation,
      adresse: data.adresse,
      statut: data.statut,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        sets.push(`${key} = $${idx++}`);
        params.push(value);
      }
    }
    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    await pool.query(
      `UPDATE partenaires SET ${sets.join(', ')} WHERE id = $${idx}`,
      params
    );
    return this.findById(id);
  }

  /**
   * Reset the must_change_password flag after a password change
   */
  async markPasswordChanged(userId: string): Promise<void> {
    await pool.query(
      `UPDATE partenaires SET must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Delete a partner profile (the linked user is deleted separately by the service)
   */
  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(`DELETE FROM partenaires WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  /**
   * Count declarations made by the partner's user id
   */
  async countDeclarations(userId: string, declarationType?: string): Promise<number> {
    const params: any[] = [userId];
    let sql = `SELECT COUNT(*)::int AS count FROM declarations WHERE reporter_id = $1`;
    if (declarationType) {
      sql += ` AND declaration_type = $2`;
      params.push(declarationType);
    }
    const { rows } = await pool.query(sql, params);
    return rows[0].count;
  }
}
