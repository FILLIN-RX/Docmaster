import { DeclarationRepository } from '../repositories/declaration.repository.ts';
import { DocumentDeclaration } from '../types/database.ts';
import { calculateDocumentFingerprint } from '../utils/crypto.utils.ts';
import { NotificationService } from './notification.service.ts';

export class DeclarationService {
  private declarationRepository: DeclarationRepository;
  private notificationService: NotificationService;

  constructor() {
    this.declarationRepository = new DeclarationRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new declaration
   */
  async createDeclaration(data: Partial<DocumentDeclaration>): Promise<DocumentDeclaration> {
    // 1. Generate unique DocMaster ID (Nomenclature: DM_YYMM_N)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() is 0-indexed
    
    // Get count for current month to generate N
    const count = await this.declarationRepository.countByMonth(year, month);
    const n = count + 1;
    
    // Format: DOC_2604_1 (for LOST) or DM_2604_1 (for FOUND)
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, '0');
    const prefix = data.declaration_type === 'LOST' ? 'DOC' : 'DM';
    data.identifiant_doc_dm = `${prefix}_${yy}${mm}_${n}`;

    // 2. Generate fingerprint for matching
    if (data.doc_type && data.document_number) {
      data.fingerprint = calculateDocumentFingerprint(data.doc_type, data.document_number);
    }

    // 3. Set default status based on type
    if (data.declaration_type === 'LOST') {
      data.status = 'SEARCHING';
    } else {
      data.status = 'AVAILABLE';
    }

    // 4. Save to DB
    const declaration = await this.declarationRepository.create(data);

    // 5. Notify user
    if (declaration.reporter_id) {
        await this.notificationService.notifyDeclarationCreated(
            declaration.reporter_id,
            declaration.declaration_type,
            declaration.doc_type
        );
    }

    // 6. Check for matches (Async - don't block the response)
    if (declaration.fingerprint) {
      this.checkMatches(declaration).catch(err => console.error('Error checking matches:', err));
    }

    return declaration;
  }

  /**
   * Internal method to check for matches and notify users
   */
  private async checkMatches(declaration: DocumentDeclaration) {
    const matches = await this.declarationRepository.findByFingerprint(declaration.fingerprint);
    
    // Find declarations of the OPPOSITE type
    const oppositeMatches = matches.filter(m => 
      m.id !== declaration.id && 
      m.declaration_type !== declaration.declaration_type
    );

    if (oppositeMatches.length > 0) {
      console.log(`🔍 [MATCH FOUND] ${oppositeMatches.length} potential matches for ${declaration.identifiant_doc_dm}`);
      
      // Notify the current reporter and the previous reporters
      for (const match of oppositeMatches) {
        if (match.reporter_id && declaration.reporter_id) {
          const lostUserId = declaration.declaration_type === 'LOST' ? declaration.reporter_id : match.reporter_id;
          const foundUserId = declaration.declaration_type === 'FOUND' ? declaration.reporter_id : match.reporter_id;
          
          await this.notificationService.notifyMatchFound(
            lostUserId, 
            foundUserId, 
            declaration.id, 
            declaration.doc_type
          );
        }
      }
    }
  }

  /**
   * Search declarations
   */
  async searchDeclarations(filters: any): Promise<DocumentDeclaration[]> {
    return await this.declarationRepository.search(filters);
  }

  /**
   * Get declarations for a user
   */
  async getUserDeclarations(userId: string): Promise<DocumentDeclaration[]> {
    return await this.declarationRepository.findByReporterId(userId);
  }

  /**
   * Get all available declarations
   */
  async getAllDeclarations(): Promise<DocumentDeclaration[]> {
    return await this.declarationRepository.findAllAvailable();
  }

  /**
   * Get by ID
   */
  async getDeclarationById(id: string): Promise<DocumentDeclaration | null> {
    return await this.declarationRepository.findById(id);
  }

  /**
   * Update a declaration
   */
  async updateDeclaration(id: string, userId: string, data: Partial<DocumentDeclaration>): Promise<DocumentDeclaration | null> {
    const declaration = await this.declarationRepository.update(id, userId, data);

    if (declaration) {
      await this.notificationService.notifyDeclarationUpdated(userId, declaration.doc_type);
    }

    return declaration;
  }
}
