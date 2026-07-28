import { pool } from '../database/db.ts';
import crypto from 'crypto';

export interface DeviceTransfer {
  id: string;
  device_id: string;
  from_user_id: string;
  to_user_id?: string;
  to_email: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  created_at: Date;
  updated_at: Date;
}

class DeviceTransferRepository {
  async create(deviceId: string, fromUserId: string, toEmail: string): Promise<DeviceTransfer> {
    const token = crypto.randomBytes(32).toString('hex');
    const query = `
      INSERT INTO device_transfers (device_id, from_user_id, to_email, token)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [deviceId, fromUserId, toEmail, token]);
    return rows[0];
  }

  async findByToken(token: string): Promise<DeviceTransfer | null> {
    const { rows } = await pool.query('SELECT * FROM device_transfers WHERE token = $1', [token]);
    return rows[0] || null;
  }

  async findPendingByDevice(deviceId: string): Promise<DeviceTransfer | null> {
    const { rows } = await pool.query(
      "SELECT * FROM device_transfers WHERE device_id = $1 AND status = 'PENDING' LIMIT 1",
      [deviceId]
    );
    return rows[0] || null;
  }

  async findPendingByEmail(email: string): Promise<DeviceTransfer[]> {
    const { rows } = await pool.query(
      "SELECT * FROM device_transfers WHERE to_email = $1 AND status = 'PENDING' ORDER BY created_at DESC",
      [email]
    );
    return rows;
  }

  async findSentByUser(userId: string): Promise<DeviceTransfer[]> {
    const { rows } = await pool.query(
      "SELECT * FROM device_transfers WHERE from_user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  async updateStatus(id: string, status: string, toUserId?: string): Promise<DeviceTransfer> {
    let query = 'UPDATE device_transfers SET status = $1, updated_at = NOW()';
    const values: any[] = [status];

    if (toUserId) {
      query += ', to_user_id = $3';
      values.push(toUserId);
      query += ' WHERE id = $' + values.length;
      values.push(id);
    } else {
      query += ' WHERE id = $2';
      values.push(id);
    }

    query += ' RETURNING *';
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async expireOld(expireHours: number = 168): Promise<number> {
    const { rowCount } = await pool.query(
      "UPDATE device_transfers SET status = 'EXPIRED', updated_at = NOW() WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '1 hour' * $1",
      [expireHours]
    );
    return rowCount || 0;
  }
}

export const deviceTransferRepository = new DeviceTransferRepository();
