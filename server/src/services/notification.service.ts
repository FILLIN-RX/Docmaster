import { NotificationRepository, Notification, DestinataireType } from '../repositories/notification.repository.ts';
import { PushTokenRepository } from '../repositories/push-token.repository.ts';
import { subscriptionService } from './subscription.service.ts';
import { SocketService } from './socket.service.ts';
import { MailService } from './mail.service.ts';
import { SmsService } from './sms.service.ts';
import { UserRepository } from '../repositories/auth.repository.ts';
import admin from '../config/firebase-admin.ts';
import pool from '../database/db.ts';

const FCM_BATCH_SIZE = 500;

interface DestinataireContact {
  id: string;
  email: string | null;
  telephone: string | null;
  nom: string;
  prenom: string;
}

/**
 * Recherche les coordonnées d'un destinataire (USER, PARTENAIRE, AUTORITE).
 * Permet d'envoyer des emails/SMS quel que soit le type.
 */
async function findDestinataireContact(
  type: DestinataireType,
  id: string
): Promise<DestinataireContact | null> {
  if (type === 'USER') {
    const { rows } = await pool.query(
      'SELECT id, email, telephone, nom, prenom FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }
  if (type === 'PARTENAIRE') {
    const { rows } = await pool.query(
      'SELECT id, email, telephone, nom_contact AS nom, prenom_contact AS prenom FROM partenaires WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }
  if (type === 'AUTORITE') {
    const { rows } = await pool.query(
      'SELECT id, email, telephone, nom, prenom FROM autorites WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }
  return null;
}

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private pushTokenRepository: PushTokenRepository;
  private socketService: SocketService;
  private mailService: MailService;
  private smsService: SmsService;
  private userRepository: UserRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.pushTokenRepository = new PushTokenRepository();
    this.socketService = SocketService.getInstance();
    this.mailService = new MailService();
    this.smsService = new SmsService();
    this.userRepository = new UserRepository();
  }

  /**
   * Create a notification. Accepte un user_id (rétro-compat) ou {destinataire_type, destinataire_id}.
   */
  async createNotification(data: Notification & { destinataire_type?: DestinataireType; destinataire_id?: string }) {
    // Résolution : user_id fourni seul → destinataire_type='USER', destinataire_id=user_id
    let destinataireType: DestinataireType = data.destinataire_type || 'USER';
    let destinataireId: string | null = data.destinataire_id || data.user_id || null;

    if (!destinataireId) {
      throw new Error('createNotification: destinataire_id or user_id is required');
    }

    // 1. Check user subscription for allowed channels (only for USER type — partenaires/autorités n'ont pas de subscription)
    const channels: any = { in_app: true };
    if (destinataireType === 'USER') {
      const smsVal = await subscriptionService.validateAction(destinataireId, 'ADD_ALERT', { alertType: 'sms' });
      channels.sms = smsVal.allowed;
      const emailVal = await subscriptionService.validateAction(destinataireId, 'ADD_ALERT', { alertType: 'email' });
      channels.email = emailVal.allowed;
      const pushVal = await subscriptionService.validateAction(destinataireId, 'ADD_ALERT', { alertType: 'push' });
      channels.push = pushVal.allowed;
    } else {
      // Partenaires & autorités : on envoie email + sms si coordonnées dispo, pas de push pour l'instant
      channels.sms = true;
      channels.email = true;
      channels.push = false;
    }

    const enrichedData = {
      ...data,
      user_id: data.user_id ?? (destinataireType === 'USER' ? destinataireId : null),
      destinataire_type: destinataireType,
      destinataire_id: destinataireId,
      channels,
    };

    const savedNotif = await this.notificationRepository.create(enrichedData);
    await this.deliverNotification(savedNotif);
    return savedNotif;
  }

  /**
   * Délivre la notification via socket (toujours), email, SMS, push FCM.
   */
  async deliverNotification(notification: any) {
    const { channels, title, message, destinataire_type, destinataire_id, user_id, type, metadata } = notification;

    // 1. Socket toujours (in-app temps réel)
    const socketTargetId = destinataire_id || user_id;
    if (destinataire_type && socketTargetId) {
      this.socketService.sendToUser(socketTargetId, 'NEW_NOTIFICATION', notification);
    }

    // 2. Lookup contact pour email/sms
    const contact = await findDestinataireContact(
      destinataire_type as DestinataireType,
      socketTargetId
    );
    if (!contact) return;

    // 3. SMS
    if (channels.sms && contact.telephone) {
      console.log(`[SMS] Sending SMS to ${contact.telephone}: ${title}`);
      try {
        let smsMessage = message;
        if (type === 'MATCH_FOUND') {
          const docType = metadata?.docType || 'document';
          smsMessage = `DocMaster: Bonne nouvelle ! Votre ${docType} a été retrouvé. Connectez-vous pour voir les détails.`;
        }
        await this.smsService.sendSms(contact.telephone, smsMessage);
      } catch (err) {
        console.error('Error sending notification SMS:', err);
      }
    }

    // 4. Email
    if (channels.email && contact.email) {
      console.log(`[EMAIL] Sending Email to ${contact.email}: ${title}`);
      try {
        if (type === 'MATCH_FOUND') {
          const docType = metadata?.docType || 'document';
          const matchType = metadata?.matchType || 'LOST_SIDE';
          await this.mailService.sendMatchNotificationEmail(
            contact.email,
            `${contact.prenom || ''} ${contact.nom || ''}`.trim(),
            docType,
            matchType as any
          );
        } else {
          await this.mailService.sendNotificationEmail(
            contact.email,
            `${contact.prenom || ''} ${contact.nom || ''}`.trim(),
            title,
            message
          );
        }
      } catch (err) {
        console.error('Error sending notification Email:', err);
      }
    }

    // 5. Push FCM (USER uniquement pour l'instant)
    if (channels.push && destinataire_type === 'USER' && user_id) {
      try {
        const tokens = await this.pushTokenRepository.findByUserId(user_id);
        const fcmTokens = tokens.map(t => t.token).filter(Boolean);
        if (fcmTokens.length > 0) {
          const response = await admin.messaging().sendEachForMulticast({
            notification: { title, body: message },
            tokens: fcmTokens,
          });
          const invalidTokens: string[] = [];
          response.responses.forEach((r, idx) => {
            if (!r.success) {
              const code = r.error?.code || '';
              if (
                code.includes('unregistered') ||
                code.includes('invalid-registration') ||
                code.includes('not-registered') ||
                code.includes('sender-id-mismatch') ||
                code.includes('NOT_FOUND')
              ) {
                invalidTokens.push(fcmTokens[idx]);
              }
            }
          });
          if (invalidTokens.length > 0) {
            await this.pushTokenRepository.deleteInvalidTokens(invalidTokens);
          }
        }
      } catch (err) {
        console.error('Error sending push notification:', err);
      }
    }
  }

  async getDestinataireNotifications(type: DestinataireType, id: string) {
    return await this.notificationRepository.findByDestinataire(type, id);
  }

  /**
   * Rétro-compat : les anciens contrôleurs utilisaient userId.
   */
  async getUserNotifications(userId: string) {
    return await this.notificationRepository.findByDestinataire('USER', userId);
  }

  async markAsRead(id: string) {
    return await this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(type: DestinataireType, id: string) {
    return await this.notificationRepository.markAllAsRead(type, id);
  }

  // ─────────────────────────────────────────────────────────
  // Helpers USER (existants — conservés)
  // ─────────────────────────────────────────────────────────

  async notifyDeclarationCreated(userId: string, type: string, docType: string) {
    const isLost = type === 'LOST';
    await this.createNotification({
      user_id: userId,
      destinataire_type: 'USER',
      destinataire_id: userId,
      type: isLost ? 'LOST_SUBMITTED' : 'FOUND_SUBMITTED',
      title: isLost ? 'Déclaration de perte enregistrée' : 'Document trouvé enregistré',
      message: isLost
        ? `Votre déclaration pour votre ${docType} est maintenant en cours de recherche.`
        : `Merci d'avoir signalé avoir trouvé ce ${docType}. Le propriétaire sera informé si une correspondance est trouvée.`,
      metadata: { docType, action: 'CREATE' }
    });
  }

  async notifyDocumentAdded(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      destinataire_type: 'USER',
      destinataire_id: userId,
      type: 'DOC_ADDED',
      title: 'Document sauvegardé',
      message: `Votre ${docType} a été ajouté à votre coffre-fort numérique.`,
      metadata: { docType, action: 'ADD' }
    });
  }

  async notifyDocumentDeleted(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      destinataire_type: 'USER',
      destinataire_id: userId,
      type: 'DOC_DELETED',
      title: 'Document supprimé',
      message: `Le document ${docType} a été retiré de votre compte.`,
      metadata: { docType, action: 'DELETE' }
    });
  }

  async notifyDocumentUpdated(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      destinataire_type: 'USER',
      destinataire_id: userId,
      type: 'DOC_UPDATED',
      title: 'Document mis à jour',
      message: `Les informations de votre ${docType} ont été modifiées avec succès.`,
      metadata: { docType, action: 'UPDATE' }
    });
  }

  async notifyDeclarationUpdated(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      destinataire_type: 'USER',
      destinataire_id: userId,
      type: 'DECL_UPDATED',
      title: 'Déclaration mise à jour',
      message: `Votre déclaration pour le document ${docType} a été mise à jour.`,
      metadata: { docType, action: 'UPDATE' }
    });
  }

  async notifyMatchFound(lostUserId: string, foundUserId: string, docId: string, docType: string) {
    await this.createNotification({
      user_id: lostUserId,
      destinataire_type: 'USER',
      destinataire_id: lostUserId,
      type: 'MATCH_FOUND',
      title: 'Bonne nouvelle ! Document trouvé',
      message: `Quelqu'un a signalé avoir trouvé votre ${docType}.`,
      metadata: { docId, docType, matchType: 'LOST_SIDE' }
    });
    await this.createNotification({
      user_id: foundUserId,
      destinataire_type: 'USER',
      destinataire_id: foundUserId,
      type: 'MATCH_FOUND',
      title: 'Correspondance trouvée !',
      message: `Le propriétaire du document ${docType} que vous avez trouvé a été identifié.`,
      metadata: { docId, docType, matchType: 'FOUND_SIDE' }
    });
  }

  async notifyVaultMatch(vaultOwnerId: string, foundDeclId: string, vaultDocId: string, docType: string) {
    await this.createNotification({
      user_id: vaultOwnerId,
      destinataire_type: 'USER',
      destinataire_id: vaultOwnerId,
      type: 'VAULT_MATCH_PENDING',
      title: 'Document trouvé — Confirmation requise',
      message: `Un ${docType} trouvé pourrait être le vôtre. Confirmez-vous qu'il s'agit de votre document ?`,
      metadata: { declaration_id: foundDeclId, vault_doc_id: vaultDocId, docType, action: 'CONFIRM_VAULT_MATCH' }
    });
  }

  async notifyPaymentReceived(finderId: string, docType: string, docId: string) {
    await this.createNotification({
      user_id: finderId,
      destinataire_type: 'USER',
      destinataire_id: finderId,
      type: 'PAYMENT_RECEIVED',
      title: 'Paiement reçu !',
      message: `Le propriétaire du document (${docType}) a effectué le paiement. Il vous contactera bientôt avec un code de vérification.`,
      metadata: { docId, action: 'RECOVERY_START' }
    });
  }

  async notifyDocumentRecovered(ownerId: string, docType: string, docId: string) {
    await this.createNotification({
      user_id: ownerId,
      destinataire_type: 'USER',
      destinataire_id: ownerId,
      type: 'RECOVERY_SUCCESS',
      title: 'Document récupéré !',
      message: `Votre ${docType} a été officiellement marqué comme récupéré. Merci d'avoir utilisé DocMaster !`,
      metadata: { docId, action: 'RECOVERY_COMPLETE' }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Helpers PARTENAIRE (nouveaux)
  // ─────────────────────────────────────────────────────────

  async notifyPartenaireDeclarationCreated(partenaireId: string, docType: string) {
    await this.createNotification({
      destinataire_type: 'PARTENAIRE',
      destinataire_id: partenaireId,
      type: 'FOUND_SUBMITTED',
      title: 'Document trouvé enregistré',
      message: `Votre déclaration pour ce ${docType} a bien été enregistrée. Le propriétaire sera notifié si une correspondance est trouvée.`,
      metadata: { docType, action: 'CREATE', partenaire_id: partenaireId }
    });
  }

  async notifyPartenaireMatchFound(partenaireId: string, docType: string, docId: string) {
    await this.createNotification({
      destinataire_type: 'PARTENAIRE',
      destinataire_id: partenaireId,
      type: 'MATCH_FOUND',
      title: 'Correspondance trouvée !',
      message: `Le propriétaire du document ${docType} que vous avez trouvé a été identifié. Vous serez contacté pour la remise.`,
      metadata: { docId, docType, matchType: 'FOUND_SIDE', partenaire_id: partenaireId }
    });
  }

  async notifyPartenaireReward(partenaireId: string, amount: number, docType: string, docId: string) {
    await this.createNotification({
      destinataire_type: 'PARTENAIRE',
      destinataire_id: partenaireId,
      type: 'PAYMENT_RECEIVED',
      title: 'Rémunération créditée !',
      message: `Vous avez reçu ${amount} XAF pour la remise de ${docType}. Le montant est disponible dans votre portefeuille.`,
      metadata: { docId, docType, amount, action: 'RECOMPENSE_PARTENAIRE', partenaire_id: partenaireId }
    });
  }

  async notifyPartenaireWalletAdjust(
    partenaireId: string,
    type: 'CREDIT' | 'DEBIT',
    amount: number,
    motif: string
  ) {
    await this.createNotification({
      destinataire_type: 'PARTENAIRE',
      destinataire_id: partenaireId,
      type: 'WALLET_ADJUSTMENT',
      title: type === 'CREDIT' ? 'Portefeuille crédité' : 'Portefeuille débité',
      message: `${type === 'CREDIT' ? '+' : '-'}${amount} XAF — ${motif}`,
      metadata: { type, amount, motif, action: 'WALLET_ADJUST' }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Helpers AUTORITE (nouveaux)
  // ─────────────────────────────────────────────────────────

  async notifyAutoriteCertification(autoriteId: string, declarationId: string, docType: string) {
    await this.createNotification({
      destinataire_type: 'AUTORITE',
      destinataire_id: autoriteId,
      type: 'CERTIFICATION_DONE',
      title: 'Déclaration certifiée',
      message: `Vous avez officiellement certifié un ${docType}.`,
      metadata: { declaration_id: declarationId, docType, action: 'CERTIFY' }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Notifications admin (existant)
  // ─────────────────────────────────────────────────────────

  async notifyAdmins(title: string, message: string, type: 'ALERT' | 'INFO' = 'INFO', metadata: any = {}) {
    try {
      const admins = await pool.query("SELECT id, email, prenom, nom FROM users WHERE role = 'ADMIN'");
      const promises = admins.rows.map((admin: any) => {
        return this.createNotification({
          user_id: admin.id,
          destinataire_type: 'USER',
          destinataire_id: admin.id,
          title,
          message,
          type,
          metadata: { ...metadata, adminEmail: admin.email, adminName: `${admin.prenom} ${admin.nom}` }
        });
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  async sendBroadcast(title: string, message: string, adminId: string) {
    const allTokens = await this.pushTokenRepository.findAllTokens();
    if (allTokens.length === 0) {
      return { sentCount: 0, totalTokens: 0 };
    }

    const fcmTokens = allTokens.map(t => t.token).filter(Boolean);
    let sentCount = 0;

    for (let i = 0; i < fcmTokens.length; i += FCM_BATCH_SIZE) {
      const batch = fcmTokens.slice(i, i + FCM_BATCH_SIZE);
      try {
        const response = await admin.messaging().sendEachForMulticast({
          notification: { title, body: message },
          tokens: batch,
        });
        sentCount += response.successCount;
      } catch (err) {
        console.error(`[Broadcast] FCM batch error at index ${i}:`, err);
      }
    }

    const userIds = [...new Set(allTokens.map(t => t.user_id))];
    const notifPromises = userIds.map(userId =>
      this.createNotification({
        user_id: userId,
        destinataire_type: 'USER',
        destinataire_id: userId,
        type: 'BROADCAST',
        title,
        message,
        metadata: { broadcast: true, sentBy: adminId },
      }).catch(() => {})
    );
    await Promise.all(notifPromises);

    console.log(`[Broadcast] Sent to ${sentCount}/${fcmTokens.length} devices, ${userIds.length} users notified`);
    return { sentCount, totalTokens: fcmTokens.length, usersNotified: userIds.length };
  }
}

export const notificationService = new NotificationService();
