import { NotificationRepository, Notification } from '../repositories/notification.repository.ts';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createNotification(data: Notification) {
    return await this.notificationRepository.create(data);
  }

  async getUserNotifications(userId: string) {
    return await this.notificationRepository.findByUserId(userId);
  }

  async markAsRead(id: string) {
    return await this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return await this.notificationRepository.markAllAsRead(userId);
  }

  /**
   * Notify when a declaration is successfully created
   */
  async notifyDeclarationCreated(userId: string, type: string, docType: string) {
    const isLost = type === 'LOST';
    await this.createNotification({
      user_id: userId,
      type: isLost ? 'LOST_SUBMITTED' : 'FOUND_SUBMITTED',
      title: isLost ? 'Déclaration de perte enregistrée' : 'Document trouvé enregistré',
      message: isLost 
        ? `Votre déclaration pour votre ${docType} est maintenant en cours de recherche.`
        : `Merci d'avoir signalé avoir trouvé ce ${docType}. Le propriétaire sera informé si une correspondance est trouvée.`,
      metadata: { docType, action: 'CREATE' }
    });
  }

  /**
   * Notify when a document is added to the user's vault
   */
  async notifyDocumentAdded(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      type: 'DOC_ADDED',
      title: 'Document sauvegardé',
      message: `Votre ${docType} a été ajouté à votre coffre-fort numérique.`,
      metadata: { docType, action: 'ADD' }
    });
  }

  /**
   * Notify when a document is deleted
   */
  async notifyDocumentDeleted(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      type: 'DOC_DELETED',
      title: 'Document supprimé',
      message: `Le document ${docType} a été retiré de votre compte.`,
      metadata: { docType, action: 'DELETE' }
    });
  }

  /**
   * Notify when a document is updated
   */
  async notifyDocumentUpdated(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      type: 'DOC_UPDATED',
      title: 'Document mis à jour',
      message: `Les informations de votre ${docType} ont été modifiées avec succès.`,
      metadata: { docType, action: 'UPDATE' }
    });
  }

  /**
   * Notify when a declaration is updated
   */
  async notifyDeclarationUpdated(userId: string, docType: string) {
    await this.createNotification({
      user_id: userId,
      type: 'DECL_UPDATED',
      title: 'Déclaration mise à jour',
      message: `Votre déclaration pour le document ${docType} a été mise à jour.`,
      metadata: { docType, action: 'UPDATE' }
    });
  }

  /**
   * Specific helper for match notifications
   */
  async notifyMatchFound(lostUserId: string, foundUserId: string, docId: string, docType: string) {
    // Notify the loser
    await this.createNotification({
      user_id: lostUserId,
      type: 'MATCH_FOUND',
      title: 'Bonne nouvelle ! Document trouvé',
      message: `Quelqu'un a signalé avoir trouvé votre ${docType}.`,
      metadata: { docId, matchType: 'LOST_SIDE' }
    });

    // Notify the finder
    await this.createNotification({
      user_id: foundUserId,
      type: 'MATCH_FOUND',
      title: 'Correspondance trouvée !',
      message: `Le propriétaire du document ${docType} que vous avez trouvé a été identifié.`,
      metadata: { docId, matchType: 'FOUND_SIDE' }
    });
  }

  /**
   * Notify the finder that the owner has paid
   */
  async notifyPaymentReceived(finderId: string, docType: string, docId: string) {
    await this.createNotification({
      user_id: finderId,
      type: 'PAYMENT_RECEIVED',
      title: 'Paiement reçu !',
      message: `Le propriétaire du document (${docType}) a effectué le paiement. Il vous contactera bientôt avec un code de vérification.`,
      metadata: { docId, action: 'RECOVERY_START' }
    });
  }
  /**
   * Notify the owner that the document has been successfully recovered
   */
  async notifyDocumentRecovered(ownerId: string, docType: string, docId: string) {
    await this.createNotification({
      user_id: ownerId,
      type: 'RECOVERY_SUCCESS',
      title: 'Document récupéré !',
      message: `Votre ${docType} a été officiellement marqué comme récupéré. Merci d'avoir utilisé DocMaster !`,
      metadata: { docId, action: 'RECOVERY_COMPLETE' }
    });
  }
}

export const notificationService = new NotificationService();
