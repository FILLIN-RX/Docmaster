import { query } from '../database/db.ts';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  date_debut: Date;
  date_fin: Date;
  status: string;
  auto_renew: boolean;
  avantages_restants: any;
  user_name?: string;
  user_email?: string;
  plan_name?: string;
}

class SubscriptionRepository {
  /**
   * Get all subscriptions with user and plan info
   */
  async findAll() {
    const sql = `
      SELECT us.*, 
             u.nom || ' ' || u.prenom as user_name, 
             u.email as user_email,
             p.name as plan_name
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN plans p ON us.plan_id = p.id
      ORDER BY us.date_debut DESC
    `;
    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get subscription by ID
   */
  async findById(id: string) {
    const result = await query('SELECT * FROM user_subscriptions WHERE id = $1', [id]);
    return result.rows[0];
  }

  /**
   * Get subscriptions for a specific user
   */
  async findByUserId(userId: string) {
    const sql = `
      SELECT us.*, p.name as plan_name
      FROM user_subscriptions us
      JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = $1
      ORDER BY us.date_debut DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }

  /**
   * Update subscription status
   */
  async updateStatus(id: string, status: string) {
    const result = await query(
      'UPDATE user_subscriptions SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  /**
   * Create new subscription
   */
  async create(sub: Partial<Subscription>) {
    const sql = `
      INSERT INTO user_subscriptions (user_id, plan_id, date_debut, date_fin, status, auto_renew, avantages_restants)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      sub.user_id,
      sub.plan_id,
      sub.date_debut || new Date(),
      sub.date_fin,
      sub.status || 'ACTIVE',
      sub.auto_renew || false,
      sub.avantages_restants || {}
    ];
    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Get simple stats for admin dashboard
   */
  async getAdminStats() {
    const totalUsers = await query('SELECT COUNT(*) FROM users');
    const activeSubs = await query("SELECT COUNT(*) FROM user_subscriptions WHERE status = 'ACTIVE'");
    const totalRevenue = await query(`
        SELECT SUM(p.price) 
        FROM user_subscriptions us 
        JOIN plans p ON us.plan_id = p.id 
        WHERE us.status = 'ACTIVE'
    `);
    
    return {
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeSubscriptions: parseInt(activeSubs.rows[0].count),
      estimatedMonthlyRevenue: parseFloat(totalRevenue.rows[0].sum || 0)
    };
  }

  /**
   * Find active subscription for a user
   */
  async findActiveByUserId(userId: string) {
    const sql = `
      SELECT us.*, p.name as plan_name, p.features
      FROM user_subscriptions us
      JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = $1 AND us.status = 'ACTIVE'
      ORDER BY us.date_debut DESC
      LIMIT 1
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }
}

export const subscriptionRepository = new SubscriptionRepository();
