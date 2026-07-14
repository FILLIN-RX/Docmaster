import { pool } from '../database/db.ts';

export class ReferralRepository {
  /**
   * Create a new referral on registration (no monetary reward yet - reward comes on subscription)
   */
  async createReferral(parrainId: string, filleulId: string): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert into referrals table (no reward yet)
      const insertRefQuery = `
        INSERT INTO referrals (parrain_id, filleul_id, points_gagnes, status, recompense_attribuee)
        VALUES ($1, $2, 0, 'PENDING', false)
        RETURNING *
      `;
      const { rows: refRows } = await client.query(insertRefQuery, [parrainId, filleulId]);

      // 2. Award Filleul: 1 month Standard plan
      const planId = 'standard';
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const insertSubQuery = `
        INSERT INTO user_subscriptions (user_id, plan_id, date_debut, date_fin, status, avantages_restants)
        VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
      `;
      const avantages = JSON.stringify({ declarations: 3 });
      await client.query(insertSubQuery, [filleulId, planId, startDate, endDate, avantages]);

      await client.query('COMMIT');
      return refRows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reward the parrain when the referred user subscribes to a paid plan
   * Gives 50% of the subscription price to the parrain's wallet
   */
  async rewardReferrerOnSubscription(filleulId: string, subscriptionAmount: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find the pending referral for this filleul
      const findRefQuery = `
        SELECT * FROM referrals 
        WHERE filleul_id = $1 AND status = 'PENDING' AND recompense_attribuee = false
        LIMIT 1
      `;
      const { rows } = await client.query(findRefQuery, [filleulId]);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return;
      }

      const referral = rows[0];
      const bonusAmount = Math.round(subscriptionAmount * 0.5);

      // 1. Credit parrain's wallet with 50% of subscription price
      await client.query(
        'UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2',
        [bonusAmount, referral.parrain_id]
      );

      // 2. Update referral record
      await client.query(
        `UPDATE referrals SET points_gagnes = $1, recompense_attribuee = true, status = 'VALIDATED' WHERE id = $2`,
        [bonusAmount, referral.id]
      );

      // 3. Record earnings history
      const { EarningsService } = await import('../services/earnings.service.ts');
      await new EarningsService().recordReferralPoints(
        referral.parrain_id,
        0,
        bonusAmount,
        { referralId: referral.id, filleulId, subscriptionAmount }
      );

      // 4. Notify parrain
      const { notificationService } = await import('../services/notification.service.js');
      await notificationService.create(
        referral.parrain_id,
        'Bonus de parrainage reçu !',
        `Vous avez reçu ${bonusAmount} XAF pour le parrainage d'un utilisateur qui a souscrit un abonnement.`,
        'REWARD'
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
        CONCAT(p.prenom, ' ', p.nom) as referrer_name,
        CONCAT(f.prenom, ' ', f.nom) as referred_name
      FROM referrals r
      JOIN users p ON r.parrain_id = p.id
      JOIN users f ON r.filleul_id = f.id
      ORDER BY r.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * Admin: Reward a referral manually (sets recompense_attribuee to true)
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

    return rows[0];
  }
}
