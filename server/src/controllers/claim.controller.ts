import { Request, Response } from 'express';
import { ClaimRepository } from '../repositories/claim.repository.ts';
import { DeclarationRepository } from '../repositories/declaration.repository.ts';
import { NotificationService } from '../services/notification.service.ts';
import { MatchRepository } from '../repositories/match.repository.ts';
import { UserRepository } from '../repositories/auth.repository.ts';

const claimRepo = new ClaimRepository();
const declRepo = new DeclarationRepository();
const notifService = new NotificationService();
const matchRepo = new MatchRepository();
const userRepo = new UserRepository();

export class ClaimController {
  /**
   * Validate the recovery code provided by the finder
   * POST /api/claims/validate
   */
  async validateCode(req: Request, res: Response) {
    try {
      const { docId, code } = req.body;

      if (!docId || !code) {
        return res.status(400).json({
          success: false,
          message: 'Document ID and verification code are required'
        });
      }

      // 1. Find the active claim for this document
      const claim = await claimRepo.findActiveByDocId(docId);

      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'No active claim found for this document. It may have already been validated or doesn\'t exist.'
        });
      }

      // 2. Check attempts limit (e.g., 5 attempts)
      if (claim.attempts >= 5) {
        return res.status(403).json({
          success: false,
          message: 'Too many failed attempts. This claim is locked for security. Please contact support.'
        });
      }

      // 3. Verify the code
      if (claim.verification_code !== code) {
        const newAttempts = await claimRepo.incrementAttempts(claim.id);
        return res.status(401).json({
          success: false,
          message: 'Invalid verification code',
          attemptsRemaining: 5 - newAttempts
        });
      }

      // 4. Code is valid! Update claim and declaration status
      await claimRepo.updateStatus(claim.id, 'VALIDATED');
      
      // Update the LOST declaration to RETURNED status
      const lostDecl = await declRepo.updateStatus(docId, 'RETURNED');

      // Find the associated FOUND declaration via matches
      const matches = await matchRepo.findByDeclarationId(docId);
      if (matches && matches.length > 0) {
        for (const match of matches) {
          // Find the counterpart (FOUND declaration)
          const foundId = match.lost_declaration_id === docId ? match.found_declaration_id : match.lost_declaration_id;
          const foundDecl = await declRepo.findById(foundId);
          
          // Double check if this FOUND declaration belongs to the current finder
          if (foundDecl && foundDecl.reporter_id === claim.finder_id) {
            await declRepo.updateStatus(foundId, 'RETURNED');
            console.log(`✅ [Claim] Marked FOUND declaration ${foundId} as RETURNED`);
          }
        }
      }

      // 5. Notify the owner that the document has been recovered
      if (lostDecl) {
        await notifService.notifyDocumentRecovered(
          claim.owner_id,
          lostDecl.doc_type,
          docId
        );

        // 6. Credit reward to finder
        if (lostDecl.recompense_montant && lostDecl.recompense_montant > 0) {
          const newBalance = await userRepo.updateBalance(claim.finder_id, lostDecl.recompense_montant);
          console.log(`💰 [Claim] Finder ${claim.finder_id} rewarded with ${lostDecl.recompense_montant}. New balance: ${newBalance}`);
        }
      }

      return res.json({
        success: true,
        message: 'Code validé avec succès ! Le document a été officiellement remis.',
        claimId: claim.id
      });

    } catch (error: any) {
      console.error('Error in validateCode:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during code validation',
        error: error.message
      });
    }
  }

  /**
   * Create a new claim manually
   * POST /api/claims/create
   */
  async createClaim(req: Request, res: Response) {
    try {
      const { docId, ownerId, finderId } = req.body;
      const userId = (req as any).user?.id;

      if (!docId || !ownerId || !finderId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID, owner ID, and finder ID are required'
        });
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const claim = await claimRepo.create({
        doc_id: docId,
        owner_id: ownerId,
        finder_id: finderId,
        verification_code: verificationCode,
        status: 'PENDING'
      });

      console.log(`🔐 [Claim] Manual claim created for document ${docId} with code ${verificationCode}`);

      return res.json({
        success: true,
        message: 'Claim created successfully',
        claim: {
          id: claim.id,
          doc_id: claim.doc_id,
          owner_id: claim.owner_id,
          finder_id: claim.finder_id,
          status: claim.status,
          created_at: claim.created_at
          // Note: verification_code not returned for security
        }
      });

    } catch (error: any) {
      console.error('Error in createClaim:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating claim',
        error: error.message
      });
    }
  }

  /**
   * Get active claim for a document (for UI display)
   */
  async getActiveClaim(req: Request, res: Response) {
    try {
      const { docId } = req.params;
      // Ensure docId is a string (not string array)
      const docIdStr = Array.isArray(docId) ? docId[0] : docId;
      const claim = await claimRepo.findActiveByDocId(docIdStr);

      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'No active claim found'
        });
      }

      // Remove sensitive data before sending to UI
      const { verification_code, ...safeClaim } = claim;

      return res.json({
        success: true,
        claim: safeClaim
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
