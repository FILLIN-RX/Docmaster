import { Request, Response } from 'express';
import { query } from '../database/db.ts';
import { v4 as uuidv4 } from 'uuid';
import { subscriptionService } from '../services/subscription.service.ts';
import { notificationService } from '../services/notification.service.ts';
import { nokashService } from '../services/nokash.service.ts';

/**
 * Handle Nokash Payment Callback
 * Body format: { id, status, amount, phone, orderId }
 */
export const nokashCallback = async (req: Request, res: Response) => {
  console.log('Nokash Callback Received:', req.body);
  
  const { id, status, orderId } = req.body;

  try {
    // 1. Find the transaction
    const transRes = await query('SELECT * FROM transactions WHERE external_ref = $1', [id]);
    if (transRes.rows.length === 0) {
      console.warn(`Transaction not found for Nokash ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
    }

    const transaction = transRes.rows[0];

    // 2. If status is SUCCESS and transaction was PENDING
    if (status === 'SUCCESS' && transaction.status === 'PENDING') {
      let metadata = transaction.metadata;
      
      // Safety parse if string (some DB adapters return JSONB as string)
      if (typeof metadata === 'string') {
        try { metadata = JSON.parse(metadata); } catch(e) { 
          console.error('Metadata parse error:', e);
        }
      }

      const { planId, months } = metadata || {};

      // Update transaction status
      await query('UPDATE transactions SET status = $1 WHERE id = $2', ['SUCCESS', transaction.id]);

      // Handle based on transaction type
      if (transaction.type === 'subscription') {
        const { planId, months } = metadata || {};
        await subscriptionService.activateSubscription(transaction.user_id, planId, months);
        console.log(`Subscription activated for user ${transaction.user_id} via Nokash ${id}`);
      } 
      else if (transaction.type === 'recovery_fee') {
        const { docId } = metadata || {};
        await activateRecovery(transaction.user_id, docId, transaction.id);
        console.log(`Recovery activated for doc ${docId} via Nokash ${id}`);
      }

      // Notify Admins
      await notificationService.notifyAdmins(
        'Nouveau Paiement Reçu',
        `Un paiement de ${transaction.amount} ${transaction.currency} a été effectué avec succès (Réf: ${id}, Type: ${transaction.type}).`,
        'INFO'
      );
    } else if (status === 'FAILED' || status === 'CANCELED') {
      await query('UPDATE transactions SET status = $1 WHERE id = $2', [status, transaction.id]);
      
      // Notify user of failure
      await notificationService.createNotification({
        user_id: transaction.user_id,
        type: 'PAYMENT_FAILED',
        title: 'Échec du Paiement',
        message: `Le paiement (${transaction.type}) a échoué ou a été annulé.`,
        metadata: { nokashId: id }
      });
    }

    // Always respond 200 to Nokash
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Nokash Callback Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get current user's transactions
 */
export const getMyTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }

    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json({ 
      success: true, 
      transactions: result.rows 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * Get all transactions (Admin)
 */
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT t.*, u.nom, u.prenom, u.email FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC'
    );

    res.status(200).json({ 
      success: true, 
      transactions: result.rows 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process payment for document recovery
 * POST /api/payments/pay-recovery
 */
export const payRecovery = async (req: Request, res: Response) => {
    const { docId, amount, paymentMethod } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    try {
        // 1. Check if declaration exists
        const declRes = await query('SELECT * FROM declarations WHERE id = $1', [docId]);
        if (declRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Déclaration non trouvée' });
        }
        const declaration = declRes.rows[0];

        // 2. Fetch document type to get pricing/commission
        const docTypeRes = await query('SELECT * FROM document_types WHERE code = $1 OR id::text = $1', [declaration.doc_type]);
        const docType = docTypeRes.rows[0];
        const finalAmount = docType ? Number(docType.prix_retrouvaille) : (amount || 5000);

        // 3. Initiate Nokash Payment
        const orderId = `REC-${uuidv4().substring(0, 8)}`;
        const nokashRes = await nokashService.initiatePayment({
            payment_method: paymentMethod === 'ORANGE_MONEY' ? 'ORANGE_MONEY' : 'MTN_MOMO',
            amount: finalAmount,
            order_id: orderId,
            user_phone: req.body.phone, // Phone provided in body
            country: 'CM'
        });

        if (nokashRes.status !== 'REQUEST_OK') {
            throw new Error(`Nokash: ${nokashRes.message || 'Erreur lors de l\'initialisation'}`);
        }

        // 4. Create PENDING transaction
        await query(
            `INSERT INTO transactions (user_id, amount, currency, status, payment_method, type, external_ref, metadata) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                userId, 
                finalAmount, 
                'XAF', 
                'PENDING', 
                paymentMethod || 'MOBILE_MONEY',
                'recovery_fee', 
                nokashRes.data.id,
                JSON.stringify({ docId })
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Paiement initié. Veuillez valider sur votre téléphone.',
            data: {
                nokashId: nokashRes.data.id,
                orderId
            }
        });
    } catch (error: any) {
        console.error('❌ [PayRecovery] Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Erreur interne du serveur lors du paiement.' });
    }
};

/**
 * Helper to activate recovery after successful payment
 */
async function activateRecovery(userId: string, docId: string, transactionId: string) {
    try {
        // 1. Fetch data
        const declRes = await query('SELECT * FROM declarations WHERE id = $1', [docId]);
        const declaration = declRes.rows[0];
        const docTypeRes = await query('SELECT * FROM document_types WHERE code = $1 OR id::text = $1', [declaration.doc_type]);
        const docType = docTypeRes.rows[0];

        // 2. Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Identify finder
        const matchRes = await query(
            `SELECT * FROM matches 
             WHERE (lost_declaration_id = $1 OR found_declaration_id = $1) 
             ORDER BY created_at DESC LIMIT 1`,
            [docId]
        );

        let finderId = null;
        if (matchRes.rows.length > 0) {
            const match = matchRes.rows[0];
            const otherId = match.lost_declaration_id === docId ? match.found_declaration_id : match.lost_declaration_id;
            const otherDeclRes = await query('SELECT reporter_id FROM declarations WHERE id = $1', [otherId]);
            if (otherDeclRes.rows.length > 0) {
                finderId = otherDeclRes.rows[0].reporter_id;
            }
        }

        // 4. Create or update claim
        const claimRes = await query('SELECT id FROM claims WHERE doc_id = $1 AND owner_id = $2', [docId, userId]);
        if (claimRes.rows.length > 0) {
            await query(
                'UPDATE claims SET status = $1, verification_code = $2, finder_id = $3 WHERE id = $4',
                ['PAID', verificationCode, finderId, claimRes.rows[0].id]
            );
        } else {
            await query(
                'INSERT INTO claims (doc_id, owner_id, finder_id, verification_code, status) VALUES ($1, $2, $3, $4, $5)',
                [docId, userId, finderId, verificationCode, 'PAID']
            );
        }

        // 5. Update declaration status
        await query('UPDATE declarations SET payment_status = $1, status = $2 WHERE id = $3', ['PAID', 'MATCHED', docId]);

        // 6. Notify finder
        if (finderId) {
            await notificationService.createNotification({
                user_id: finderId,
                type: 'PAYMENT_PENDING',
                title: 'Paiement effectué par le propriétaire',
                message: `Le propriétaire a payé les frais. Vous recevrez votre récompense une fois le code de vérification validé lors de la remise.`,
                metadata: { docId }
            });
        }
    } catch (err) {
        console.error('Error activating recovery:', err);
        throw err;
    }
}
