import { DocumentRepository } from '../repositories/document.repository.ts';
import { UserDocument } from '../types/database.ts';
import { calculateDocumentFingerprint } from '../utils/crypto.utils.ts';
import { NotificationService } from './notification.service.ts';

export class DocumentService {
  private documentRepository: DocumentRepository;
  private notificationService: NotificationService;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Register a user's own document
   */
  async registerUserDocument(data: Partial<UserDocument>): Promise<UserDocument> {
    // Sanitize dates: convert empty strings to null
    if (data.date_expiration === '' as any) {
      data.date_expiration = undefined;
    }

    // Automatically calculate fingerprint if type and number are provided
    if (data.type_doc && data.numero_doc) {
      data.fingerprint = calculateDocumentFingerprint(data.type_doc, data.numero_doc);
    }
    
    const doc = await this.documentRepository.createUserDocument(data);

    // Notify user
    if (doc.user_id) {
        await this.notificationService.notifyDocumentAdded(doc.user_id, doc.type_doc);
    }

    return doc;
  }

  /**
   * Get documents for a specific user
   */
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    return await this.documentRepository.findUserDocuments(userId);
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<UserDocument | null> {
    return await this.documentRepository.findById(id);
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const doc = await this.documentRepository.findById(id);
    const deleted = await this.documentRepository.deleteDocument(id, userId);
    
    if (deleted && doc) {
        await this.notificationService.notifyDocumentDeleted(userId, doc.type_doc);
    }
    
    return deleted;
  }

  /**
   * Update a document
   */
  async updateDocument(id: string, userId: string, data: Partial<UserDocument>): Promise<UserDocument | null> {
    // Recalculate fingerprint if needed
    if (data.type_doc || data.numero_doc) {
      // Need full data to calculate fingerprint
      const existing = await this.documentRepository.findById(id);
      if (existing) {
        data.fingerprint = calculateDocumentFingerprint(
          data.type_doc || existing.type_doc, 
          data.numero_doc || existing.numero_doc
        );
      }
    }

    const doc = await this.documentRepository.updateDocument(id, userId, data);
    
    if (doc) {
      await this.notificationService.notifyDocumentUpdated(userId, doc.type_doc);
    }

    return doc;
  }
}
