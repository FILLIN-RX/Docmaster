import { DeclarationRepository } from '../repositories/declaration.repository.ts';
import { DocumentDeclaration } from '../types/database.ts';
import { calculateDocumentFingerprint } from '../utils/crypto.utils.ts';
import { NotificationService } from './notification.service.ts';
import { matchingService } from './matching.service.ts';
import { MatchRepository } from '../repositories/match.repository.ts';

export class DeclarationService {
  private declarationRepository: DeclarationRepository;
  private notificationService: NotificationService;
  private matchRepository: MatchRepository;

  constructor() {
    this.declarationRepository = new DeclarationRepository();
    this.notificationService = new NotificationService();
    this.matchRepository = new MatchRepository();
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

    // 2. Generate fingerprint and check for duplicates
    if (data.doc_type && data.document_number) {
      data.fingerprint = calculateDocumentFingerprint(data.doc_type, data.document_number);
      
      // Prevent duplicates of the SAME type (duplicate prevention)
      const existing = await this.declarationRepository.checkDuplicate(data.fingerprint, data.declaration_type!);
      if (existing) {
        throw new Error(`Une déclaration de type ${data.declaration_type === 'LOST' ? 'PERTE' : 'TROUVAILLE'} existe déjà pour ce numéro.`);
      }
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

    // 6. Check for matches using the new scoring algorithm
    matchingService.findAndNotifyMatches(declaration).catch(err => console.error('Error checking matches:', err));

    return declaration;
  }

  /**
   * Internal method to check for matches and notify users
   */

  /**
   * Search declarations
   */
  async searchDeclarations(filters: any): Promise<DocumentDeclaration[]> {
    return await this.declarationRepository.search(filters);
  }

  /**
   * Get declarations for a user with their match status
   */
  async getUserDeclarations(userId: string): Promise<any[]> {
    const declarations = await this.declarationRepository.findByReporterId(userId);
    
    // Attach match info to each declaration
    const results = await Promise.all(declarations.map(async (decl) => {
      const matches = await this.matchRepository.findByDeclarationId(decl.id);
      return {
        ...decl,
        matches: matches || []
      };
    }));

    return results;
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

  async getGlobalStats() {
    return await this.declarationRepository.getGlobalStats();
  }

  /**
   * Search for FOUND documents with public data masking
   */
  async searchPublicFound(query: string) {
    const results = await this.declarationRepository.searchPublicFound(query);
    
    return results.map(doc => ({
      ...doc,
      owner_name: this.maskName(doc.owner_name),
      document_number: this.maskNumber(doc.document_number),
      // Mask reporter if present
      reporter_id: 'HIDDEN'
    }));
  }

  private maskName(name: string): string {
    if (!name) return '***';
    return name.split(' ').map(p => p.length > 1 ? p[0] + '*'.repeat(p.length - 1) : p + '*').join(' ');
  }

  private maskNumber(num: string): string {
    if (!num) return '***';
    if (num.length < 4) return '**' + '*'.repeat(num.length - 2);
    return num.substring(0, 2) + '*'.repeat(num.length - 4) + num.substring(num.length - 2);
  }
}
