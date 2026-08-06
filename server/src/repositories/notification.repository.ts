import pool from '../database/db.js';

export type DestinataireType = 'USER' | 'PARTENAIRE' | 'AUTORITE';

export interface Notification {
  id?: string;
  user_id?: string | null;
  destinataire_type?: DestinataireType;
  destinataire_id?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  is_read?: boolean;
  channels?: any;
  created_at?: Date;
}

export class NotificationRepository {
  async create(data: Notification): Promise<Notification> {
    // Résolution automatique : si pas de destinataire_type/id mais user_id fourni → USER
    const destinataireType: DestinataireType = (data.destinataire_type as DestinataireType) || 'USER';
    const destinataireId = data.destinataire_id ?? data.user_id ?? null;

    const query = `
      INSERT INTO notifications (user_id, destinataire_type, destinataire_id, type, title, message, metadata, channels)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      data.user_id ?? null,
      destinataireType,
      destinataireId,
      data.type,
      data.title,
      data.message,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.channels ? JSON.stringify(data.channels) : JSON.stringify({ push: true, email: true })
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * List notifications for a destinataire (USER, PARTENAIRE, AUTORITE).
   */
  async findByDestinataire(type: DestinataireType, id: string): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE destinataire_type = $1 AND destinataire_id = $2
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [type, id]);
    return rows;
  }

  /**
   * Rétro-compat : cherche par user_id uniquement.
   */
  async findByUserId(userId: string): Promise<Notification[]> {
    return this.findByDestinataire('USER', userId);
  }

  async markAsRead(id: string): Promise<boolean> {
    const query = 'UPDATE notifications SET is_read = true WHERE id = $1';
    const { rowCount } = await pool.query(query, [id]);
    return (rowCount ?? 0) > 0;
  }

  async markAllAsRead(type: DestinataireType, id: string): Promise<boolean> {
    const query = `
      UPDATE notifications SET is_read = true
      WHERE destinataire_type = $1 AND destinataire_id = $2 AND is_read = false
    `;
    const { rowCount } = await pool.query(query, [type, id]);
    return (rowCount ?? 0) > 0;
  }
}
