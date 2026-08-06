import argon2 from 'argon2';
import crypto from 'crypto';
import { AutoriteRepository } from './autorites.repository.ts';
import { generateAutoriteToken } from './autorites.config.ts';
import { MailService } from '../../services/mail.service.ts';
import { SmsService } from '../../services/sms.service.ts';
import { NotificationService } from '../../services/notification.service.ts';
import { SocketService } from '../../services/socket.service.ts';
import pool from '../../database/db.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3003';

export class AutoriteService {
  private repository = new AutoriteRepository();
  private mailService = new MailService();
  private smsService = new SmsService();
  private notificationService = new NotificationService();

  /**
   * Generate a temporary password for a new authority
   */
  private generateTempPassword(): string {
    return crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  }

  /**
   * Admin / HAUTE creates a new authority
   */
  async create(data: any, createdBy: string) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new Error('Une autorité avec cet email existe déjà');
    }

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await argon2.hash(tempPassword);

    const autorite = await this.repository.create({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      mot_de_passe: hashedPassword,
      niveau: data.niveau || 'NORMAL',
      ville: data.ville,
      region: data.region,
      created_by: createdBy,
    });

    // Envoyer l'invitation par email
    try {
      await this.mailService.sendAuthorityInviteEmail(
        autorite.email,
        `${autorite.prenom} ${autorite.nom}`,
        tempPassword,
        `${FRONTEND_URL}/autorite/connexion`
      );
    } catch (err: any) {
      console.error('❌ [Autorites] Email invitation échoué:', err.message);
    }

    // Envoyer SMS si téléphone fourni
    if (autorite.telephone) {
      try {
        await this.smsService.sendSms(
          autorite.telephone,
          `Bonjour ${autorite.prenom}, votre compte autorité DocMaster est créé. Connectez-vous sur ${FRONTEND_URL}/autorite/connexion avec votre mot de passe temporaire.`
        );
      } catch (err: any) {
        console.error('❌ [Autorites] SMS invitation échoué:', err.message);
      }
    }

    // Notification aux admins
    try {
      await this.notificationService.notifyAdmins(
        'Nouvelle autorité créée',
        `Nouvelle autorité ${autorite.niveau}: ${autorite.prenom} ${autorite.nom} (${autorite.ville})`,
        'INFO',
        { autorite_id: autorite.id }
      );
    } catch (err: any) {
      console.error('❌ [Autorites] Notification admin échouée:', err.message);
    }

    const { mot_de_passe, ...safe } = autorite;
    return { ...safe, temp_password: tempPassword };
  }

  /**
   * Authority login — returns JWT
   */
  async login(email: string, motDePasse: string) {
    const autorite = await this.repository.findByEmail(email);
    if (!autorite) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const valid = await argon2.verify(autorite.mot_de_passe, motDePasse);
    if (!valid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const token = generateAutoriteToken(autorite.id, autorite.email, autorite.niveau);
    const { mot_de_passe: _pwd, ...safe } = autorite;

    await this.logActivity(
      autorite,
      'AUTHORITY_LOGIN',
      'AUTHORITE',
      autorite.id,
      `Connexion de ${autorite.prenom} ${autorite.nom}`
    );

    return { token, autorite: safe };
  }

  /**
   * Change password (mandatory on first login)
   */
  async changePassword(autoriteId: string, ancienMotDePasse: string, nouveauMotDePasse: string) {
    const autorite = await this.repository.findByIdWithPassword(autoriteId);
    if (!autorite) {
      throw new Error('Autorité introuvable');
    }

    const valid = await argon2.verify(autorite.mot_de_passe, ancienMotDePasse);
    if (!valid) {
      throw new Error('Ancien mot de passe incorrect');
    }

    if (nouveauMotDePasse.length < 8) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    const hashed = await argon2.hash(nouveauMotDePasse);
    await this.repository.updatePassword(autoriteId, hashed);
    return { success: true, message: 'Mot de passe mis à jour avec succès' };
  }

  /**
   * List authorities (admin / haute)
   */
  async findAll(filters?: any) {
    return this.repository.findAll(filters);
  }

  /**
   * Get authority by id
   */
  async findById(id: string) {
    return this.repository.findById(id);
  }

  /**
   * Get the certifier display name for the PDF stamp
   */
  async findCertificateur(autoriteId: string): Promise<string | null> {
    try {
      const res = await pool.query(
        'SELECT nom, prenom FROM autorites WHERE id = $1',
        [autoriteId]
      );
      if (res.rows[0]) {
        return `${res.rows[0].prenom} ${res.rows[0].nom}`;
      }
    } catch (err: any) {
      console.error('❌ [Autorites] Certificateur introuvable:', err.message);
    }
    return null;
  }

  /**
   * Update an authority (admin)
   */
  async update(id: string, data: any) {
    return this.repository.update(id, {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      niveau: data.niveau,
      ville: data.ville,
      region: data.region,
      is_active: data.is_active === undefined ? undefined : data.is_active === 'true' || data.is_active === true,
    });
  }

  /**
   * Delete an authority (admin)
   */
  async delete(id: string) {
    const autorite = await this.repository.findById(id);
    if (!autorite) {
      throw new Error('Autorité introuvable');
    }
    const ok = await this.repository.delete(id);
    if (!ok) throw new Error('Suppression impossible');
    return { success: true };
  }

  /**
   * Get declarations visible to an authority
   * HAUTE: all declarations
   * NORMAL: only declarations in their city
   */
  async getDeclarations(autorite: any, filters?: any) {
    const conditions: string[] = ['d.deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (autorite.niveau === 'NORMAL' && autorite.ville) {
      conditions.push(`d.ville ILIKE $${idx++}`);
      params.push(`%${autorite.ville}%`);
    }

    if (filters?.declaration_type) {
      let declType = String(filters.declaration_type).toUpperCase();
      if (declType === 'PERDU') declType = 'LOST';
      if (declType === 'TROUVE') declType = 'FOUND';
      conditions.push(`d.declaration_type = $${idx++}`);
      params.push(declType);
    }

    if (filters?.status) {
      conditions.push(`d.status = $${idx++}`);
      params.push(filters.status);
    }

    if (filters?.is_certified !== undefined) {
      conditions.push(`d.is_certified = $${idx++}`);
      params.push(filters.is_certified === 'true' || filters.is_certified === true);
    }

    if (filters?.search) {
      conditions.push(`(
        d.owner_name ILIKE $${idx}
        OR d.document_number ILIKE $${idx}
        OR d.identifiant_doc_dm ILIKE $${idx}
      )`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const limit = Math.min(parseInt(filters?.limit) || 50, 100);
    const offset = Math.max(parseInt(filters?.offset) || 0, 0);

    const query = `
      SELECT d.*,
        dt.nom AS doc_type_nom,
        a.nom AS certified_by_nom,
        a.prenom AS certified_by_prenom,
        u.nom AS reporter_nom,
        u.prenom AS reporter_prenom,
        (
          SELECT CONCAT(fu.prenom, ' ', fu.nom)
          FROM matches m
          LEFT JOIN declarations fd ON fd.id = m.found_declaration_id
          LEFT JOIN users fu ON fu.id = fd.reporter_id
          WHERE m.lost_declaration_id = d.id
            AND m.status IN ('PENDING', 'CONFIRMED')
          LIMIT 1
        ) AS finder_name,
        (
          SELECT CONCAT(lu.prenom, ' ', lu.nom)
          FROM matches m
          LEFT JOIN declarations ld ON ld.id = m.lost_declaration_id
          LEFT JOIN users lu ON lu.id = ld.reporter_id
          WHERE m.found_declaration_id = d.id
            AND m.status IN ('PENDING', 'CONFIRMED')
          LIMIT 1
        ) AS owner_name_from_match
      FROM declarations d
      LEFT JOIN document_types dt
        ON dt.id = normalize_doc_type(d.doc_type)
        OR dt.code = d.doc_type
      LEFT JOIN autorites a ON a.id = d.certified_by
      LEFT JOIN users u ON u.id = d.reporter_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Log an authority action for the zone activity journal
   */
  private async logActivity(
    autorite: any,
    actionType: string,
    entityType?: string,
    entityId?: string,
    description?: string,
    metadata: any = {}
  ) {
    try {
      await pool.query(
        `INSERT INTO autorite_activity_logs
         (autorite_id, autorite_nom, autorite_prenom, autorite_niveau, autorite_ville, autorite_region,
          action_type, entity_type, entity_id, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          autorite.id, autorite.nom, autorite.prenom, autorite.niveau || 'NORMAL',
          autorite.ville, autorite.region,
          actionType, entityType, entityId, description, metadata,
        ]
      );
    } catch (err: any) {
      console.error('❌ [Autorites] Log activité échoué:', err.message);
    }
  }

  /**
   * Get the zone activity journal.
   * HAUTE: sees activity of its region (or city, or all if neither set).
   * NORMAL: sees activity of its own city.
   */
  async getActivityLogs(autorite: any, filters?: any) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (autorite.niveau === 'HAUTE') {
      if (autorite.region) {
        conditions.push(`autorite_region ILIKE $${idx++}`);
        params.push(`%${autorite.region}%`);
      } else if (autorite.ville) {
        conditions.push(`autorite_ville ILIKE $${idx++}`);
        params.push(`%${autorite.ville}%`);
      }
    } else if (autorite.ville) {
      conditions.push(`autorite_ville ILIKE $${idx++}`);
      params.push(`%${autorite.ville}%`);
    }

    if (filters?.action_type) {
      conditions.push(`action_type = $${idx++}`);
      params.push(filters.action_type);
    }
    if (filters?.entity_type) {
      conditions.push(`entity_type = $${idx++}`);
      params.push(filters.entity_type);
    }

    const limit = Math.min(parseInt(filters?.limit) || 50, 100);
    const offset = Math.max(parseInt(filters?.offset) || 0, 0);

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countQuery = await pool.query(
      `SELECT COUNT(*)::int AS count FROM autorite_activity_logs ${where}`,
      params
    );
    const rowsQuery = await pool.query(
      `SELECT * FROM autorite_activity_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    return {
      total: countQuery.rows[0].count,
      data: rowsQuery.rows,
    };
  }

  /**
   * Certify a declaration
   */
  async certify(autorite: any, declarationId: string) {
    const declQuery = await pool.query(
      'SELECT * FROM declarations WHERE id = $1 AND deleted_at IS NULL',
      [declarationId]
    );
    const declaration = declQuery.rows[0];
    if (!declaration) {
      throw new Error('Déclaration introuvable');
    }

    // NORMAL authority can only certify declarations in their city
    if (autorite.niveau === 'NORMAL' && autorite.ville) {
      const declVille = (declaration.ville || '').toLowerCase();
      const autVille = (autorite.ville || '').toLowerCase();
      if (!declVille.includes(autVille) && !autVille.includes(declVille)) {
        throw new Error('Vous ne pouvez certifier que les déclarations de votre ville');
      }
    }

    const result = await pool.query(
      `UPDATE declarations
       SET is_certified = true, certified_by = $1, certified_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [autorite.id, declarationId]
    );
    const updated = result.rows[0];

    // Zone activity journal
    await this.logActivity(
      autorite,
      'CERTIFY_DECLARATION',
      'DECLARATION',
      declarationId,
      `Certifié la déclaration ${declaration.identifiant_doc_dm || ''} de ${declaration.owner_name || ''}`,
      { declaration_id: declarationId, doc_type: declaration.doc_type }
    );

    // Notifier le propriétaire + admins
    try {
      if (declaration.reporter_id) {
        await this.notificationService.createNotification({
          user_id: declaration.reporter_id,
          destinataire_type: 'USER',
          destinataire_id: declaration.reporter_id,
          type: 'DECLARATION_CERTIFIED',
          title: 'Déclaration certifiée',
          message: `Votre déclaration ${declaration.identifiant_doc_dm || ''} a été validée et certifiée par une autorité DocMaster.`,
          metadata: { declaration_id: declarationId },
        });

        // Envoyer un email au déclarant
        try {
          const userRes = await pool.query(
            'SELECT email, prenom, nom FROM users WHERE id = $1',
            [declaration.reporter_id]
          );
          const user = userRes.rows[0];
          const emailTo = user?.email || declaration.email_contact;
          if (emailTo) {
            const userName = user ? `${user.prenom} ${user.nom}`.trim() : (declaration.owner_name || '');
            await this.mailService.sendNotificationEmail(
              emailTo,
              userName || 'cher utilisateur',
              'Déclaration certifiée',
              `Votre déclaration <strong>${declaration.identifiant_doc_dm || ''}</strong> concernant <strong>${declaration.document_number || declaration.doc_type || 'le document'}</strong> a été validée et certifiée par l'autorité <strong>${autorite.prenom} ${autorite.nom}</strong>. Vous pouvez télécharger l'attestation PDF depuis votre tableau de bord.`
            );
          }
        } catch (mailErr: any) {
          console.error('❌ [Autorites] Email de certification échoué:', mailErr.message);
        }
      }
      await this.notificationService.notifyAdmins(
        'Déclaration certifiée',
        `Déclaration certifiée par ${autorite.prenom} ${autorite.nom}`,
        'INFO',
        { declaration_id: declarationId, autorite_id: autorite.id }
      );
    } catch (err: any) {
      console.error('❌ [Autorites] Notification certification échouée:', err.message);
    }

    try {
      SocketService.getInstance().sendToAdmins('DECLARATION_CERTIFIED', { declaration_id: declarationId, certified_by: autorite.id });
    } catch (err: any) {
      console.error('❌ [Autorites] Socket certification échoué:', err.message);
    }

    // Notification à l'autorité elle-même (pour l'historique de son journal)
    try {
      const docType = declaration.doc_type || 'document';
      await this.notificationService.notifyAutoriteCertification(
        autorite.id,
        declarationId,
        docType
      );
    } catch (err: any) {
      console.error('❌ [Autorites] Notification autorité échouée:', err.message);
    }

    return updated;
  }

  /**
   * Uncertify a declaration (HAUTE only)
   */
  async uncertify(autorite: any, declarationId: string) {
    if (autorite.niveau !== 'HAUTE') {
      throw new Error('Seule une autorité haute peut retirer une certification');
    }
    const result = await pool.query(
      `UPDATE declarations
       SET is_certified = false, certified_by = NULL, certified_at = NULL
       WHERE id = $1
       RETURNING *`,
      [declarationId]
    );
    if (result.rows.length === 0) {
      throw new Error('Déclaration introuvable');
    }

    await this.logActivity(
      autorite,
      'UNCERTIFY_DECLARATION',
      'DECLARATION',
      declarationId,
      `Retiré la certification de la déclaration ${result.rows[0].identifiant_doc_dm || ''}`
    );

    return result.rows[0];
  }

  /**
   * HAUTE authority creates another authority
   */
  async createByHaute(data: any, hauteId: string) {
    if (data.niveau && data.niveau !== 'NORMAL') {
      throw new Error('Une autorité haute ne peut créer que des autorités de niveau');
    }
    const result = await this.create({ ...data, niveau: 'NORMAL' }, hauteId);
    const haute = await this.repository.findById(hauteId);
    if (haute) {
      await this.logActivity(
        haute,
        'CREATE_AUTORITE',
        'AUTORITE',
        result.id,
        `Créé l'autorité ${result.prenom} ${result.nom} (${result.ville})`,
        { autorite_created: result.id, ville: result.ville }
      );
    }
    return result;
  }

  /**
   * List authorities created by the current HAUTE authority
   */
  async getManaged(hauteId: string) {
    return this.repository.findByCreatedBy(hauteId);
  }

  /**
   * HAUTE deletes one of the authorities it created
   */
  async deleteManaged(hauteId: string, autoriteId: string) {
    const autorite = await this.repository.findById(autoriteId);
    if (!autorite) {
      throw new Error('Autorité introuvable');
    }
    if (autorite.created_by !== hauteId) {
      throw new Error('Vous ne pouvez supprimer que les autorités que vous avez créées');
    }
    const ok = await this.repository.delete(autoriteId);
    if (!ok) throw new Error('Suppression impossible');
    const haute = await this.repository.findById(hauteId);
    if (haute) {
      await this.logActivity(
        haute,
        'DELETE_AUTORITE',
        'AUTORITE',
        autoriteId,
        `Supprimé l'autorité ${autorite.prenom} ${autorite.nom} (${autorite.ville})`
      );
    }
    return { success: true };
  }

  /**
   * Stats for authority dashboard
   */
  async getStats(autorite: any) {
    const where: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (autorite.niveau === 'NORMAL' && autorite.ville) {
      where.push(`ville ILIKE $${idx++}`);
      params.push(`%${autorite.ville}%`);
    }

    const base = `FROM declarations WHERE ${where.join(' AND ')}`;
    const [total, certified, lost, found] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count ${base}`, params),
      pool.query(`SELECT COUNT(*)::int AS count ${base} AND is_certified = true`, params),
      pool.query(`SELECT COUNT(*)::int AS count ${base} AND declaration_type = 'LOST'`, params),
      pool.query(`SELECT COUNT(*)::int AS count ${base} AND declaration_type = 'FOUND'`, params),
    ]);

    return {
      total: total.rows[0].count,
      certified: certified.rows[0].count,
      lost: lost.rows[0].count,
      found: found.rows[0].count,
      by_me: (await pool.query(
        `SELECT COUNT(*)::int AS count FROM declarations WHERE certified_by = $1`,
        [autorite.id]
      )).rows[0].count,
    };
  }
}
