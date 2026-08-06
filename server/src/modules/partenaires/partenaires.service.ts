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
   * Admin creates a new standalone partner account (like autorites, no user linked)
   */
  async create(data: any, createdBy: string) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new Error('Un partenaire avec cet email existe déjà');
    }

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await argon2.hash(tempPassword);

    const profile = await this.repository.create({
      nom_organisation: data.nom_organisation,
      adresse: data.adresse,
      email: data.email,
      mot_de_passe: hashedPassword,
      telephone: data.telephone || null,
      nom_contact: data.nom_contact || data.nom_organisation,
      prenom_contact: data.prenom_contact || 'Organisation',
      ville: data.ville || null,
      region: data.region || null,
      created_by: createdBy,
    });

    // 1. Send invitation email with temp password
    try {
      await this.mailService.sendPartnerInviteEmail(
        profile.email,
        data.nom_organisation,
        tempPassword,
        `${FRONTEND_URL}/partenaire/connexion`
      );
    } catch (err: any) {
      console.error('❌ [Partenaires] Email invitation échoué:', err.message);
    }

    // 2. Send SMS if phone provided
    if (profile.telephone) {
      try {
        await this.smsService.sendSms(
          profile.telephone,
          `Bonjour, votre compte partenaire DocMaster "${data.nom_organisation}" est créé. Connectez-vous sur ${FRONTEND_URL}/partenaire/connexion avec votre mot de passe temporaire.`
        );
      } catch (err: any) {
        console.error('❌ [Partenaires] SMS invitation échoué:', err.message);
      }
    }

    // 3. Notify admins
    try {
      await this.notificationService.notifyAdmins(
        'Nouveau partenaire créé',
        `Nouveau compte organisation : ${data.nom_organisation} (${profile.email})`,
        'INFO',
        { partenaire_id: profile.id }
      );
    } catch (err: any) {
      console.error('❌ [Partenaires] Notification admin échouée:', err.message);
    }

    return {
      id: profile.id,
      nom_organisation: profile.nom_organisation,
      email: profile.email,
      telephone: profile.telephone,
      statut: profile.statut,
      temp_password: tempPassword,
    };
  }

  /**
   * Partner login — returns JWT (id = partenaire.id)
   */
  async login(email: string, motDePasse: string) {
    const profile = await this.repository.findByEmail(email);
    if (!profile) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const valid = await argon2.verify(profile.mot_de_passe || '', motDePasse);
    if (!valid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    if (profile.statut !== 'ACTIF') {
      throw new Error('Compte partenaire désactivé. Contactez un administrateur.');
    }

    const token = generateToken(profile.id, profile.email, 'PARTNER');
    const { mot_de_passe, ...safe } = profile;
    return {
      token,
      partenaire: safe,
    };
  }

  /**
   * Change password (mandatory on first login)
   */
  async changePassword(partenaireId: string, ancienMotDePasse: string, nouveauMotDePasse: string) {
    if (nouveauMotDePasse.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    const profile = await this.repository.findByIdWithPassword(partenaireId);
    if (!profile) {
      throw new Error('Compte introuvable');
    }

    const valid = await argon2.verify(profile.mot_de_passe || '', ancienMotDePasse);
    if (!valid) {
      throw new Error('Ancien mot de passe incorrect');
    }

    const hashed = await argon2.hash(nouveauMotDePasse);
    await this.repository.updatePassword(partenaireId, hashed);

    return { success: true, message: 'Mot de passe changé avec succès' };
  }

  /**
   * Get partner profile by partenaire id
   */
  async findById(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile) return null;
    return {
      ...profile,
      wallet_balance: Number(profile.wallet_balance || 0),
    };
  }

  /**
   * Partner stats: declaration counts + wallet balance
   */
  async getStats(partenaireId: string) {
    const [total, matched, returned, available] = await Promise.all([
      this.repository.countDeclarations(partenaireId),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM declarations WHERE reporter_id = $1 AND reporter_type = 'PARTENAIRE' AND declaration_type = 'FOUND' AND status = 'MATCHED'`,
        [partenaireId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM declarations WHERE reporter_id = $1 AND reporter_type = 'PARTENAIRE' AND declaration_type = 'FOUND' AND status = 'RETURNED'`,
        [partenaireId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM declarations WHERE reporter_id = $1 AND reporter_type = 'PARTENAIRE' AND declaration_type = 'FOUND' AND status = 'AVAILABLE'`,
        [partenaireId]
      ),
    ]);
    const balanceRes = await pool.query(
      `SELECT COALESCE(wallet_balance, 0)::float AS balance FROM partenaires WHERE id = $1`,
      [partenaireId]
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
  async getDeclarations(partenaireId: string, filters: any = {}) {
    const conditions = [
      `d.reporter_id = $1`,
      `d.reporter_type = 'PARTENAIRE'`,
      `d.declaration_type = 'FOUND'`,
    ];
    const params: any[] = [partenaireId];
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
  async createFoundDeclaration(data: any, partenaireId: string, files: any) {
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
        reporter_id: partenaireId,
        reporter_type: 'PARTENAIRE',
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
  async deleteDeclaration(declarationId: string, partenaireId: string) {
    return this.declarationService.deleteDeclaration(declarationId, partenaireId);
  }

  /**
   * Partner wallet: balance + history
   */
  async getWallet(partenaireId: string, filters: any = {}) {
    const balanceRes = await pool.query(
      `SELECT COALESCE(wallet_balance, 0)::float AS balance FROM partenaires WHERE id = $1`,
      [partenaireId]
    );
    const history = await walletService.getPartnerHistory(
      partenaireId,
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

    let balance: number;
    if (type === 'CREDIT') {
      balance = await walletService.creditPartner(partenaireId, amount, 'ADMIN_ADJUSTMENT', { metadata });
    } else {
      balance = await walletService.debitPartner(partenaireId, amount, 'ADMIN_ADJUSTMENT', { metadata });
    }

    // Notification du partenaire
    try {
      await this.notificationService.notifyPartenaireWalletAdjust(
        partenaireId,
        type,
        amount,
        motif || (type === 'CREDIT' ? 'Ajustement administrateur (crédit)' : 'Ajustement administrateur (débit)')
      );
    } catch (err) {
      console.error('❌ [Partenaires] Notification wallet ajust échouée:', (err as any).message);
    }

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
        nom_organisation: r.nom_organisation,
        email: r.email,
        telephone: r.telephone,
        nom_contact: r.nom_contact,
        prenom_contact: r.prenom_contact,
        ville: r.ville,
        region: r.region,
        adresse: r.adresse,
        statut: r.statut,
        wallet_balance: Number(r.wallet_balance || 0),
        created_at: r.created_at,
      })),
      total: result.total,
    };
  }

  /**
   * Admin updates a partner (standalone columns, no user to touch)
   */
  async update(partenaireId: string, data: any) {
    const profile = await this.repository.findById(partenaireId);
    if (!profile) {
      throw new Error('Partenaire introuvable');
    }

    if (data.email !== undefined && data.email !== profile.email) {
      const taken = await this.repository.findByEmail(data.email);
      if (taken && taken.id !== partenaireId) {
        throw new Error('Cet email est déjà utilisé par un autre compte');
      }
    }

    const updated = await this.repository.update(partenaireId, {
      nom_organisation: data.nom_organisation,
      adresse: data.adresse,
      statut: data.statut,
      email: data.email,
      telephone: data.telephone,
      nom_contact: data.nom_contact,
      prenom_contact: data.prenom_contact,
      ville: data.ville,
      region: data.region,
    });

    return this.findById(partenaireId);
  }

  /**
   * Partner updates its own organisation profile (no email / statut)
   */
  async updateProfil(partenaireId: string, data: any) {
    const profile = await this.repository.findById(partenaireId);
    if (!profile) {
      throw new Error('Partenaire introuvable');
    }

    const updated = await this.repository.update(partenaireId, {
      nom_organisation: data.nom_organisation,
      telephone: data.telephone,
      nom_contact: data.nom_contact,
      prenom_contact: data.prenom_contact,
      adresse: data.adresse,
      ville: data.ville,
      region: data.region,
    });

    return this.findById(partenaireId);
  }

  /**
   * Admin deletes a partner (fully standalone, no user to delete)
   */
  async delete(partenaireId: string) {
    const profile = await this.repository.findById(partenaireId);
    if (!profile) {
      throw new Error('Partenaire introuvable');
    }
    await this.repository.delete(partenaireId);
    return { success: true, message: 'Partenaire supprimé' };
  }
}
