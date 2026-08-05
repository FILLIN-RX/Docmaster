import argon2 from 'argon2';
import crypto from 'crypto';
import pool from '../../database/db.js';
import { PartenaireRepository } from './partenaires.repository.ts';
import { generateToken } from '../../config/jwt.ts';
import { MailService } from '../../services/mail.service.ts';
import { SmsService } from '../../services/sms.service.ts';
import { NotificationService } from '../../services/notification.service.ts';
import { walletService } from '../../services/wallet.service.ts';
import { DeclarationService } from '../../services/declaration.service.ts';
import { DocumentDeclaration } from '../../types/database.ts';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3003';

export class PartenaireService {
  private repository = new PartenaireRepository();
  private mailService = new MailService();
  private smsService = new SmsService();
  private notificationService = new NotificationService();
  private declarationService = new DeclarationService();

  /**
   * Generate a temporary password for a new partner
   */
  private generateTempPassword(): string {
    return crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  }

  /**
   * Admin creates a new partner (organisation account)
   */
  async create(data: any, createdBy: string) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new Error('Un partenaire avec cet email existe déjà');
    }
    const emailTaken = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [data.email]
    );
    if (emailTaken.rows.length > 0) {
      throw new Error('Cet email est déjà utilisé par un autre compte');
    }

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await argon2.hash(tempPassword);

    // 1. Create the underlying user (role PARTNER)
    const userRes = await pool.query(
      `INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, pays, ville, is_verified, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'PARTNER')
       RETURNING id, nom, prenom, email, telephone, ville, wallet_balance`,
      [
        data.nom_contact || data.nom_organisation,
        data.prenom_contact || 'Organisation',
        data.email,
        data.telephone || null,
        hashedPassword,
        'Cameroun',
        data.ville || 'Yaoundé',
      ]
    );
    const user = userRes.rows[0];

    // 2. Create the partenaire profile
    const profile = await this.repository.create({
      user_id: user.id,
      nom_organisation: data.nom_organisation,
      adresse: data.adresse,
      created_by: createdBy,
    });

    // 3. Send invitation email with temp password
    try {
      await this.mailService.sendPartnerInviteEmail(
        user.email,
        data.nom_organisation,
        tempPassword,
        `${FRONTEND_URL}/partenaire/connexion`
      );
    } catch (err: any) {
      console.error('❌ [Partenaires] Email invitation échoué:', err.message);
    }

    // 4. Send SMS if phone provided
    if (user.telephone) {
      try {
        await this.smsService.sendSms(
          user.telephone,
          `Bonjour, votre compte partenaire DocMaster "${data.nom_organisation}" est créé. Connectez-vous sur ${FRONTEND_URL}/partenaire/connexion avec votre mot de passe temporaire.`
        );
      } catch (err: any) {
        console.error('❌ [Partenaires] SMS invitation échoué:', err.message);
      }
    }

    // 5. Notify admins
    try {
      await this.notificationService.notifyAdmins(
        'Nouveau partenaire créé',
        `Nouveau compte organisation : ${data.nom_organisation} (${user.email})`,
        'INFO',
        { partenaire_id: profile.id }
      );
    } catch (err: any) {
      console.error('❌ [Partenaires] Notification admin échouée:', err.message);
    }

    return {
      id: profile.id,
      user_id: user.id,
      nom_organisation: profile.nom_organisation,
      email: user.email,
      telephone: user.telephone,
      statut: profile.statut,
      temp_password: tempPassword,
    };
  }

  /**
   * Partner login — returns JWT
   */
  async login(email: string, motDePasse: string) {
    const profile = await this.repository.findByEmail(email);
    if (!profile) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const pwdRes = await pool.query(
      `SELECT mot_de_passe FROM users WHERE id = $1`,
      [profile.user_id]
    );
    if (!pwdRes.rows[0]) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const valid = await argon2.verify(pwdRes.rows[0].mot_de_passe, motDePasse);
    if (!valid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    if (profile.statut !== 'ACTIF') {
      throw new Error('Compte partenaire désactivé. Contactez un administrateur.');
    }

    const token = generateToken(profile.user_id, profile.email, 'PARTNER');
    const { must_change_password, wallet_balance } = profile;
    return {
      token,
      partenaire: {
        id: profile.id,
        user_id: profile.user_id,
        nom_organisation: profile.nom_organisation,
        email: profile.email,
        telephone: profile.telephone,
        nom_contact: profile.nom_contact,
        prenom_contact: profile.prenom_contact,
        ville: profile.ville,
        region: profile.region,
        statut: profile.statut,
        must_change_password,
        wallet_balance,
      },
    };
  }

  /**
   * Change password (mandatory on first login)
   */
  async changePassword(userId: string, ancienMotDePasse: string, nouveauMotDePasse: string) {
    if (nouveauMotDePasse.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    const pwdRes = await pool.query(`SELECT mot_de_passe FROM users WHERE id = $1`, [userId]);
    if (!pwdRes.rows[0]) {
      throw new Error('Compte introuvable');
    }

    const valid = await argon2.verify(pwdRes.rows[0].mot_de_passe, ancienMotDePasse);
    if (!valid) {
      throw new Error('Ancien mot de passe incorrect');
    }

    const hashed = await argon2.hash(nouveauMotDePasse);
    await pool.query(
      `UPDATE users SET mot_de_passe = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [hashed, userId]
    );
    await this.repository.markPasswordChanged(userId);

    return { success: true, message: 'Mot de passe changé avec succès' };
  }

  /**
   * Get partner profile by partenaire id
   */
  async findById(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile) return null;
    const { nom_contact, prenom_contact, ...safe } = profile;
    return {
      ...safe,
      nom_contact,
      prenom_contact,
      wallet_balance: Number(profile.wallet_balance || 0),
    };
  }

  /**
   * Partner stats: declaration counts + wallet balance
   */
  async getStats(userId: string) {
    const [total, matched, returned, available] = await Promise.all([
      this.repository.countDeclarations(userId),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM declarations WHERE reporter_id = $1 AND declaration_type = 'FOUND' AND status = 'MATCHED'`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM declarations WHERE reporter_id = $1 AND declaration_type = 'FOUND' AND status = 'RETURNED'`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM declarations WHERE reporter_id = $1 AND declaration_type = 'FOUND' AND status = 'AVAILABLE'`,
        [userId]
      ),
    ]);
    const balanceRes = await pool.query(
      `SELECT COALESCE(wallet_balance, 0)::float AS balance FROM users WHERE id = $1`,
      [userId]
    );

    return {
      total_declarations: total,
      found: total,
      matched: matched.rows[0].count,
      returned: returned.rows[0].count,
      available: available.rows[0].count,
      wallet_balance: balanceRes.rows[0]?.balance || 0,
    };
  }

  /**
   * List the partner's found declarations (FOUND only)
   */
  async getDeclarations(userId: string, filters: any = {}) {
    const conditions = [
      `d.reporter_id = $1`,
      `d.declaration_type = 'FOUND'`,
    ];
    const params: any[] = [userId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`d.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.doc_type) {
      conditions.push(`d.doc_type::text = $${idx}`);
      params.push(filters.doc_type);
      idx++;
    }
    if (filters.q) {
      conditions.push(`(d.owner_name ILIKE $${idx} OR d.document_number ILIKE $${idx} OR d.identifiant_doc_dm ILIKE $${idx})`);
      params.push(`%${filters.q}%`);
      idx++;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const offset = (page - 1) * limit;

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM declarations d ${where}`,
      params
    );

    const query = `
      SELECT d.id, d.identifiant_doc_dm, d.doc_type, d.owner_name, d.document_number,
             d.status, d.ville, d.quartier, d.photo_recto, d.photo_verso,
             d.description, d.created_at,
             dt.nom AS doc_type_name, dt.code AS doc_type_code
      FROM declarations d
      LEFT JOIN document_types dt ON (dt.id::text = d.doc_type OR dt.code = d.doc_type)
      ${where}
      ORDER BY d.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const { rows } = await pool.query(query, [...params, limit, offset]);
    return { rows, total: countRes.rows[0].total, page, limit };
  }

  /**
   * Create a found declaration (partners can only declare TROUVAILLE, unlimited)
   */
  async createFoundDeclaration(data: any, userId: string, files: any) {
    const photo_recto = files?.photo_recto?.[0]?.path;
    const photo_verso = files?.photo_verso?.[0]?.path;

    if (data.declaration_type && data.declaration_type !== 'FOUND') {
      throw new Error('Les partenaires peuvent uniquement créer des déclarations de trouvaille');
    }

    if (data.found_location && typeof data.found_location === 'string') {
      try {
        data.found_location = JSON.parse(data.found_location);
      } catch (e) {
        data.found_location = undefined;
      }
    }
    if (data.metadata && typeof data.metadata === 'string') {
      try {
        data.metadata = JSON.parse(data.metadata);
      } catch (e) {
        data.metadata = undefined;
      }
    }

    const declaration = await this.declarationService.createDeclaration(
      {
        ...data,
        declaration_type: 'FOUND',
        reporter_id: userId,
        photo_recto,
        photo_verso,
      },
      { bypassLimits: true }
    );

    return declaration;
  }

  /**
   * Delete one of the partner's own declarations
   */
  async deleteDeclaration(declarationId: string, userId: string) {
    return this.declarationService.deleteDeclaration(declarationId, userId);
  }

  /**
   * Partner wallet: balance + history
   */
  async getWallet(userId: string, filters: any = {}) {
    const balanceRes = await pool.query(
      `SELECT COALESCE(wallet_balance, 0)::float AS balance FROM users WHERE id = $1`,
      [userId]
    );
    const history = await walletService.getHistory(
      userId,
      Math.min(100, Number(filters.limit) || 50),
      Number(filters.offset) || 0
    );
    return {
      balance: balanceRes.rows[0]?.balance || 0,
      history,
    };
  }

  /**
   * Admin adjusts a partner wallet (credit/debit)
   */
  async adjustWallet(partenaireId: string, type: 'CREDIT' | 'DEBIT', amount: number, motif?: string, adminId?: string) {
    const profile = await this.repository.findById(partenaireId);
    if (!profile) {
      throw new Error('Partenaire introuvable');
    }

    const metadata = {
      partenaire_id: partenaireId,
      nom_organisation: profile.nom_organisation,
      motif: motif || (type === 'CREDIT' ? 'Ajustement admin (crédit)' : 'Ajustement admin (débit)'),
      by_admin: adminId || null,
    };

    if (type === 'CREDIT') {
      const balance = await walletService.credit(profile.user_id, amount, 'ADMIN_ADJUSTMENT', { metadata });
      return { success: true, type, amount, balance };
    }
    const balance = await walletService.debit(profile.user_id, amount, 'ADMIN_ADJUSTMENT', { metadata });
    return { success: true, type, amount, balance };
  }

  /**
   * Admin lists all partners
   */
  async findAll(filters: any = {}) {
    const result = await this.repository.findAll({
      search: filters.search,
      statut: filters.statut,
      page: Number(filters.page) || 1,
      limit: Number(filters.limit) || 20,
    });
    return {
      rows: result.rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        nom_organisation: r.nom_organisation,
        email: r.email,
        telephone: r.telephone,
        ville: r.ville,
        statut: r.statut,
        wallet_balance: Number(r.wallet_balance || 0),
        created_at: r.created_at,
      })),
      total: result.total,
    };
  }

  /**
   * Admin updates a partner
   */
  async update(partenaireId: string, data: any) {
    const profile = await this.repository.findById(partenaireId);
    if (!profile) {
      throw new Error('Partenaire introuvable');
    }

    const userUpdates: string[] = [];
    const userParams: any[] = [];
    let idx = 1;

    if (data.email !== undefined) {
      const taken = await pool.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2`,
        [data.email, profile.user_id]
      );
      if (taken.rows.length > 0) {
        throw new Error('Cet email est déjà utilisé par un autre compte');
      }
      userUpdates.push(`email = $${idx++}`);
      userParams.push(data.email);
    }
    if (data.telephone !== undefined) {
      userUpdates.push(`telephone = $${idx++}`);
      userParams.push(data.telephone || null);
    }
    if (data.nom_contact !== undefined) {
      userUpdates.push(`nom = $${idx++}`);
      userParams.push(data.nom_contact || data.nom_organisation || profile.nom_organisation);
    }
    if (data.prenom_contact !== undefined) {
      userUpdates.push(`prenom = $${idx++}`);
      userParams.push(data.prenom_contact || 'Organisation');
    }
    if (data.ville !== undefined) {
      userUpdates.push(`ville = $${idx++}`);
      userParams.push(data.ville);
    }
    if (data.region !== undefined) {
      userUpdates.push(`region = $${idx++}`);
      userParams.push(data.region || null);
    }

    if (userUpdates.length > 0) {
      await pool.query(
        `UPDATE users SET ${userUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`,
        [...userParams, profile.user_id]
      );
    }

    const updated = await this.repository.update(partenaireId, {
      nom_organisation: data.nom_organisation,
      adresse: data.adresse,
      statut: data.statut,
    });

    return this.findById(partenaireId);
  }

  /**
   * Admin deletes a partner (profile + underlying user)
   */
  async delete(partenaireId: string) {
    const profile = await this.repository.findById(partenaireId);
    if (!profile) {
      throw new Error('Partenaire introuvable');
    }
    await this.repository.delete(partenaireId);
    await pool.query(`DELETE FROM users WHERE id = $1`, [profile.user_id]);
    return { success: true, message: 'Partenaire supprimé' };
  }
}
