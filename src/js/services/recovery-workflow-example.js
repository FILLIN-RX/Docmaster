/**
 * ═════════════════════════════════════════════════════════════════
 * RECOVERY WORKFLOW EXAMPLE
 * Exemple d'utilisation complet du workflow de récupération de documents
 * ═════════════════════════════════════════════════════════════════
 */

import { 
  createClaim,
  getActiveClaim,
  validateRecoveryCode,
  payRecoveryFee,
  getMyTransactions,
  initiateRecovery
} from './api.js';

/**
 * EXEMPLE 1: Propriétaire qui veut récupérer son document
 */
export async function ownerRecoveryWorkflow(documentId) {
  console.log('🔍 [WORKFLOW] Début du processus de récupération pour le document:', documentId);

  try {
    // 1. Vérifier si un claim existe déjà
    const claimResult = await getActiveClaim(documentId);
    
    if (!claimResult.success) {
      console.log('❌ Aucun claim actif trouvé pour ce document');
      return { success: false, message: 'Aucun processus de récupération en cours' };
    }

    console.log('✅ Claim trouvé:', claimResult.data.claim);

    // 2. Payer les frais de récupération
    const paymentResult = await payRecoveryFee({
      docId: documentId,
      amount: 1000, // 1000 XAF par exemple
      paymentMethod: 'MOBILE_MONEY'
    });

    if (!paymentResult.success) {
      console.log('❌ Erreur lors du paiement:', paymentResult.message);
      return { success: false, message: 'Erreur lors du paiement' };
    }

    console.log('💳 Paiement réussi! Code de vérification:', paymentResult.data.verificationCode);

    // 3. Valider le code de récupération
    const validationResult = await validateRecoveryCode({
      docId: documentId,
      code: paymentResult.data.verificationCode
    });

    if (!validationResult.success) {
      console.log('❌ Code invalide:', validationResult.message);
      return { success: false, message: 'Code de vérification invalide' };
    }

    console.log('🎉 Document récupéré avec succès!');
    return { 
      success: true, 
      message: 'Document récupéré avec succès',
      claimId: validationResult.data.claimId
    };

  } catch (error) {
    console.error('❌ Erreur dans le workflow:', error);
    return { success: false, message: 'Erreur technique' };
  }
}

/**
 * EXEMPLE 2: Trouveur qui veut initier la récupération
 */
export async function finderInitiateWorkflow(documentId) {
  console.log('🤝 [WORKFLOW] Initiation de la récupération par le trouveur:', documentId);

  try {
    // 1. Initier le processus de récupération
    const initiateResult = await initiateRecovery(documentId);

    if (!initiateResult.success) {
      console.log('❌ Erreur lors de l\'initialisation:', initiateResult.message);
      return { success: false, message: 'Erreur lors de l\'initialisation' };
    }

    console.log('✅ Processus de récupération initié!');
    console.log('📧 Le propriétaire sera notifié et pourra payer les frais');

    return { 
      success: true, 
      message: 'Processus de récupération initié avec succès',
      nextSteps: [
        'Le propriétaire a été notifié',
        'Il devra payer les frais de récupération',
        'Il recevra un code de vérification',
        'Vous devrez valider ce code lors de la remise'
      ]
    };

  } catch (error) {
    console.error('❌ Erreur dans le workflow:', error);
    return { success: false, message: 'Erreur technique' };
  }
}

/**
 * EXEMPLE 3: Création manuelle d'un claim (admin)
 */
export async function createManualClaim(documentData) {
  console.log('🔧 [WORKFLOW] Création manuelle d\'un claim');

  try {
    const claimResult = await createClaim({
      docId: documentData.docId,
      ownerId: documentData.ownerId,
      finderId: documentData.finderId
    });

    if (!claimResult.success) {
      console.log('❌ Erreur lors de la création du claim:', claimResult.message);
      return { success: false, message: 'Erreur lors de la création du claim' };
    }

    console.log('✅ Claim créé avec succès:', claimResult.data.claim);
    return { success: true, data: claimResult.data };

  } catch (error) {
    console.error('❌ Erreur dans la création du claim:', error);
    return { success: false, message: 'Erreur technique' };
  }
}

/**
 * EXEMPLE 4: Voir l'historique des transactions
 */
export async function viewTransactionHistory() {
  console.log('💼 [WORKFLOW] Récupération de l\'historique des transactions');

  try {
    const transactionsResult = await getMyTransactions();

    if (!transactionsResult.success) {
      console.log('❌ Erreur lors de la récupération des transactions:', transactionsResult.message);
      return { success: false, message: 'Erreur lors de la récupération' };
    }

    console.log('📋 Historique des transactions:');
    transactionsResult.data.forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.type} - ${transaction.amount} ${transaction.currency} - ${transaction.status}`);
    });

    return { success: true, data: transactionsResult.data };

  } catch (error) {
    console.error('❌ Erreur lors de la récupération:', error);
    return { success: false, message: 'Erreur technique' };
  }
}

/**
 * UTILITAIRE: Vérifier le statut complet d'un document
 */
export async function getDocumentRecoveryStatus(documentId) {
  console.log('📊 [WORKFLOW] Vérification du statut de récupération du document:', documentId);

  try {
    // Récupérer les informations du claim
    const claimResult = await getActiveClaim(documentId);
    
    if (!claimResult.success) {
      return {
        success: true,
        status: 'NO_CLAIM',
        message: 'Aucun processus de récupération en cours'
      };
    }

    const claim = claimResult.data.claim;
    
    return {
      success: true,
      status: claim.status,
      claim: {
        id: claim.id,
        status: claim.status,
        createdAt: claim.created_at,
        // Note: le code de vérification n'est pas inclus pour des raisons de sécurité
      },
      nextSteps: getNextSteps(claim.status)
    };

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return { success: false, message: 'Erreur technique' };
  }
}

/**
 * Helper function pour déterminer les prochaines étapes
 */
function getNextSteps(status) {
  switch (status) {
    case 'PENDING':
      return [
        'Payer les frais de récupération',
        'Attendre le code de vérification',
        'Présenter le code au trouveur'
      ];
    case 'VALIDATED':
      return [
        'Document récupéré avec succès',
        'Processus terminé'
      ];
    case 'FAILED':
      return [
        'Contactez le support',
        'Vérifiez les informations du claim'
      ];
    default:
      return ['Statut inconnu'];
  }
}

// Exporter tous les workflows pour utilisation
export default {
  ownerRecoveryWorkflow,
  finderInitiateWorkflow,
  createManualClaim,
  viewTransactionHistory,
  getDocumentRecoveryStatus
};
