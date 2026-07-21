import { Request, Response } from 'express';
import { DeclarationRepository } from '../repositories/declaration.repository.ts';
import { MatchRepository } from '../repositories/match.repository.ts';
import { ClaimRepository } from '../repositories/claim.repository.ts';
import { DocumentRepository } from '../repositories/document.repository.ts';
import { DocumentTypeRepository } from '../repositories/document-type.repository.ts';
import { NotificationService } from '../services/notification.service.ts';
import { pool } from '../database/db.js';

const declarationRepository = new DeclarationRepository();
const matchRepository = new MatchRepository();
const claimRepository = new ClaimRepository();
const documentRepository = new DocumentRepository();
const docTypeRepository = new DocumentTypeRepository();
const notificationService = new NotificationService();

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateLostIdentifiant(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const yy = String(year).slice(-2);
  const mm = String(month).padStart(2, '0');
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM declarations
     WHERE declaration_type = 'LOST'
       AND EXTRACT(YEAR FROM created_at) = $1
       AND EXTRACT(MONTH FROM created_at) = $2`,
    [year, month]
  );
  const n = parseInt(rows[0].count) + 1;
  return `DOC_${yy}${mm}_${n}`;
}

export async function respondVaultMatch(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const { declaration_id, vault_doc_id, response } = req.body;

    if (!declaration_id || !response || !['yes', 'no'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides. declaration_id et response (yes/no) requis.',
      });
    }

    const foundDecl = await declarationRepository.findById(declaration_id);
    if (!foundDecl) {
      return res.status(404).json({ success: false, message: 'Déclaration introuvable' });
    }

    if (foundDecl.declaration_type !== 'FOUND') {
      return res.status(400).json({ success: false, message: 'La déclaration doit être de type FOUND' });
    }

    if (response === 'yes') {
      // Get the vault document info for the lost declaration
      let vaultDoc = null;
      if (vault_doc_id) {
        vaultDoc = await documentRepository.findById(vault_doc_id);
      }

      // Create a LOST declaration for the vault owner
      const lostIdentifiant = await generateLostIdentifiant();
      const lostDecl = await declarationRepository.create({
        identifiant_doc_dm: lostIdentifiant,
        doc_type: foundDecl.doc_type,
        owner_name: vaultDoc?.nom_sur_doc || foundDecl.owner_name,
        document_number: vaultDoc?.numero_doc || foundDecl.document_number,
        declaration_type: 'LOST',
        status: 'SEARCHING',
        reporter_id: userId,
        ville: foundDecl.ville,
        region: foundDecl.region,
        pays: foundDecl.pays,
        fingerprint: vaultDoc?.fingerprint || foundDecl.fingerprint,
        etat_physique: foundDecl.etat_physique,
        mode_contact: 'APP_CHAT',
        metadata: { source: 'vault_confirmation', vault_doc_id },
      });

      // Now mark it as MATCHED since it's confirmed
      await declarationRepository.updateStatus(lostDecl.id, 'MATCHED');
      await declarationRepository.updateStatus(foundDecl.id, 'MATCHED');

      // Create the match between the new LOST and existing FOUND
      const match = await matchRepository.create(
        lostDecl.id,
        foundDecl.id,
        100,
        'CONFIRMED',
        { source: 'vault_confirmation', vault_doc_id },
      );

      // Update vault doc's lost status
      if (vault_doc_id) {
        await documentRepository.updateLostStatus(vault_doc_id, userId, true, lostDecl.id);
      }

      // Create a claim
      const verificationCode = generateVerificationCode();
      await claimRepository.create({
        doc_id: foundDecl.id,
        owner_id: userId,
        finder_id: foundDecl.reporter_id!,
        verification_code: verificationCode,
        status: 'PENDING',
      });

      // Resolve doc type name
      const meta = await docTypeRepository.findById(foundDecl.doc_type)
                || await docTypeRepository.findByCode(foundDecl.doc_type);
      const docTypeLabel = meta?.nom || foundDecl.doc_type;

      await notificationService.notifyMatchFound(
        userId,
        foundDecl.reporter_id!,
        lostDecl.id,
        docTypeLabel,
      );

      return res.json({
        success: true,
        message: 'Match confirmé. Le findeur a été notifié.',
        match,
      });
    }

    if (response === 'no') {
      console.log(`[VaultMatch] User ${userId} rejected vault match for declaration ${declaration_id}`);
      return res.json({
        success: true,
        message: 'Merci de nous avoir informé. Aucune action supplémentaire ne sera prise.',
      });
    }
  } catch (error) {
    console.error('❌ [VaultMatch] Error responding to vault match:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}
