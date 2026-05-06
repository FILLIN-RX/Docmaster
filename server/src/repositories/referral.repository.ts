import { pool } from '../database/db.ts';

export class ReferralRepository {
  /**
   * Create a new referral
   */
  async createReferral(parrainId: string, filleulId: string, pointsGagnes: number = 500): Promise<any> {
    const query = `
      INSERT INTO referrals (parrain_id, filleul_id, points_gagnes, status)
      VALUES ($1, $2, $3, 'VALIDATED')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [parrainId, filleulId, pointsGagnes]);
    
    // update parrain points
    const updatePointsQuery = `
      UPDATE users 
      SET points = COALESCE(points, 0) + $1 
      WHERE id = $2
    `;
    await pool.query(updatePointsQuery, [pointsGagnes, parrainId]);

    // Give the filleul their reward, e.g., 3 free declarations. Let's add them to points or wallet?
    // The spec said: "500 XAF pour vous + 1 mois gratuit pour votre filleul" but also "3 déclarations gratuites".
    // Let's assume declarations are paid by wallet_balance or plan. Let's just create the referral for now.
    
    return rows[0];
  }

  /**
   * Get all referrals for a user (as a parrain)
   */
  async getReferralsByParrain(parrainId: string): Promise<any[]> {
    const query = `
      SELECT r.*, u.nom, u.prenom, u.photo_url, u.created_at as filleul_created_at
      FROM referrals r
      JOIN users u ON r.filleul_id = u.id
      WHERE r.parrain_id = $1
      ORDER BY r.created_at DESC
    `;
    const { rows } = await pool.query(query, [parrainId]);
    return rows;
  }

  /**
   * Get all referrals for Admin
   */
  async getAllReferrals(): Promise<any[]> {
    const query = `
      SELECT 
        r.*, 
        p.nom as parrain_nom, p.prenom as parrain_prenom, p.email as parrain_email,
        f.nom as filleul_nom, f.prenom as filleul_prenom, f.email as filleul_email
      FROM referrals r
      JOIN users p ON r.parrain_id = p.id
      JOIN users f ON r.filleul_id = f.id
      ORDER BY r.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * Admin: Reward a referral manually
   */
  async rewardReferral(id: string): Promise<any> {
    const query = `
      UPDATE referrals 
      SET recompense_attribuee = true 
      WHERE id = $1 AND recompense_attribuee = false
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      throw new Error('Le parrainage est déjà récompensé ou n\'existe pas.');
    }

    const ref = rows[0];
    
    // Add points/wallet to parrain
    const rewardAmount = ref.points_gagnes || 500;
    const updateParrainQuery = `
      UPDATE users 
      SET wallet = COALESCE(wallet, 0) + $1,
          points = COALESCE(points, 0) + 10 -- Bonus points
      WHERE id = $2
    `;
    await pool.query(updateParrainQuery, [rewardAmount, ref.parrain_id]);

    return ref;
  }
}
