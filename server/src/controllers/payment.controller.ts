import { Request, Response } from 'express';
import { TransactionRepository } from '../repositories/transaction.repository.ts';
import { ClaimRepository } from '../repositories/claim.repository.ts';
import { NotificationService } from '../services/notification.service.ts';
import { DeclarationRepository } from '../repositories/declaration.repository.ts';
import { UserRepository } from '../repositories/auth.repository.ts';
import { DocumentTypeRepository } from '../repositories/document-type.repository.ts';

const transRepo = new TransactionRepository();
const claimRepo = new ClaimRepository();
const notifService = new NotificationService();
const declRepo = new DeclarationRepository();
const userRepo = new UserRepository();
const docTypeRepo = new DocumentTypeRepository();

export class PaymentController {
  /**
   * Simulate a payment for document recovery
   * POST /api/payments/pay-recovery
   */
  async payRecovery(req: Request, res: Response) {
    try {
      const { docId, amount, paymentMethod } = req.body;
      const userId = (req as any).user?.id || req.body.userId; // Fallback for dev if auth middleware not applied

      if (!docId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Document ID and amount are required'
        });
      }

      // 1. Create a PENDING transaction
      const transaction = await transRepo.create({
        user_id: userId,
        amount: amount,
        status: 'PENDING',
        payment_method: paymentMethod || 'MOBILE_MONEY',
        type: 'recovery_fee',
        metadata: { docId }
      });

      console.log(`[Payment] Transaction ${transaction.id} initiated for doc ${docId}`);

      // 2. Simulate external payment delay (fictitious)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Update transaction to SUCCESS
      const updatedTrans = await transRepo.updateStatus(
        transaction.id, 
        'SUCCESS', 
        'EXT-MOCK-' + Math.random().toString(36).substring(7).toUpperCase()
      );

      // 4. Retrieve the verification code from the claim
      const claim = await claimRepo.findByDocIdAndOwner(docId, userId);

      if (!claim) {
        return res.status(404).json({
          success: true, // Transaction succeeded but claim missing? 
          transaction: updatedTrans,
          message: 'Payment successful, but no claim record found for this document.'
        });
      }

      // 5. Update claim status to PAID
      await claimRepo.updateStatus(claim.id, 'PAID');

      // 6. Notify the finder and Distribute commission
      const declaration = await declRepo.findById(docId);
      if (declaration) {
        // Find document type for percentages
        const docType = await docTypeRepo.findByCode(declaration.doc_type);
        
        if (docType) {
          const finderAmount = (amount * docType.finder_percent) / 100;
          
          console.log(`[Payment] Distributing commission: ${finderAmount} to finder ${claim.finder_id}`);
          
          // Credit the finder's wallet
          await userRepo.updateBalance(claim.finder_id, finderAmount);
          
          // Award points to the finder
          if (docType.points_recompense > 0) {
            console.log(`[Payment] Awarding ${docType.points_recompense} points to finder ${claim.finder_id}`);
            await userRepo.updatePoints(claim.finder_id, docType.points_recompense);
          }
          
          // Record the payout transaction
          await transRepo.create({
            user_id: claim.finder_id,
            amount: finderAmount,
            status: 'SUCCESS',
            payment_method: 'WALLET',
            type: 'finder_payout',
            metadata: { docId, originalAmount: amount, commissionPercent: docType.finder_percent }
          });
        }

        await notifService.notifyPaymentReceived(
          claim.finder_id, 
          declaration.doc_type, 
          docId
        );
      }

      return res.json({
        success: true,
        message: 'Paiement effectué avec succès !',
        transaction: updatedTrans,
        verificationCode: claim.verification_code // Reveal the code to the owner
      });

    } catch (error: any) {
      console.error('Error in payRecovery:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du paiement',
        error: error.message
      });
    }
  }

  /**
   * Get transaction history for user
   */
  async getMyTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const transactions = await transRepo.findByUser(userId);
      return res.json({ success: true, transactions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Admin: Get all transactions
   */
  async getAllTransactionsAdmin(req: Request, res: Response) {
    try {
      const transactions = await transRepo.getAll();
      return res.json({ success: true, transactions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
