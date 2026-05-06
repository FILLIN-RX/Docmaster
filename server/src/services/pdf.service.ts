import PDFDocument from 'pdfkit';
import { Response } from 'express';
import path from 'path';

export class PdfService {
  /**
   * Generates a PDF design for a given document declaration
   * and pipes it directly to the response object.
   */
  async generateDeclarationPdf(declaration: any, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Initialize PDF Document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Pipe its output to the response
        doc.pipe(res);

        // Document Title
        doc
          .font('Helvetica-Bold')
          .fontSize(24)
          .fillColor('#1e3a2f')
          .text('DocMaster - Attestation de Déclaration', { align: 'center' });

        doc.moveDown();

        // Line separator
        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .strokeColor('#EAE3D8')
          .stroke();

        doc.moveDown();

        // Meta Info
        doc
          .font('Helvetica')
          .fontSize(12)
          .fillColor('#6B7280')
          .text(`Référence: ${declaration.identifiant_doc_dm || declaration.id}`, { align: 'right' })
          .text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });

        doc.moveDown(2);

        // Main info title
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#F5A64B')
          .text('Informations sur le Document');
        
        doc.moveDown();

        // Details
        doc.font('Helvetica').fontSize(12).fillColor('#1a1a1a');
        doc.text(`Type de document: ${declaration.doc_type}`);
        doc.text(`Nom figurant sur le document: ${declaration.owner_name}`);
        doc.text(`Type de déclaration: ${declaration.type === 'LOST' ? 'Perdu' : 'Trouvé'}`);
        doc.text(`Date de déclaration: ${new Date(declaration.created_at).toLocaleDateString('fr-FR')}`);
        doc.text(`Ville/Lieu: ${declaration.ville || 'Non spécifié'}`);

        // Add Photo if available
        if (declaration.photo_recto) {
          try {
            doc.moveDown();
            const photoPath = path.resolve(declaration.photo_recto);
            doc.image(photoPath, {
              fit: [250, 150],
              align: 'center'
            });
            doc.fontSize(8).text('Photo du document (Recto)', { align: 'center' });
            doc.fontSize(12); // Reset to default
            doc.moveDown();
          } catch (imgErr) {
            console.warn('Could not add image to PDF:', imgErr);
          }
        }

        doc.moveDown(2);

        // Status
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#F5A64B')
          .text('Statut Actuel');
        
        doc.moveDown();
        doc.font('Helvetica').fontSize(12).fillColor('#1a1a1a');
        doc.text(`Statut: ${declaration.status}`);
        
        if (declaration.description) {
          doc.moveDown();
          doc.font('Helvetica-Oblique').text(`Description: "${declaration.description}"`);
        }

        doc.moveDown(3);

        // Footer / Signature area
        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .strokeColor('#EAE3D8')
          .stroke();

        doc.moveDown();
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#6B7280')
          .text('Ce document est certifié par DocMaster. Toute falsification est interdite.', { align: 'center' });

        doc.moveDown(2);
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#1e3a2f')
          .text('Le Directeur Administratif', { align: 'right' });
        
        doc.moveDown(3);
        doc
          .text('______________________', { align: 'right' });

        // Finalize PDF file
        doc.end();

        // Resolve when stream finishes
        res.on('finish', () => resolve());
        res.on('error', (err) => reject(err));

      } catch (err) {
        reject(err);
      }
    });
  }
}
