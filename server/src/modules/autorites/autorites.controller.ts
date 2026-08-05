import { Request, Response } from 'express';
import { AutoriteService } from './autorites.service.ts';
import { PdfService } from '../../services/pdf.service.ts';
import { DeclarationService } from '../../services/declaration.service.ts';
import { validateDTO } from '../../utils/validation.utils.ts';
import {
  CreateAutoriteDTO,
  LoginAutoriteDTO,
  ChangePasswordAutoriteDTO,
  UpdateAutoriteDTO,
} from './autorites.dto.ts';

export class AutoriteController {
  private service = new AutoriteService();
  private pdfService = new PdfService();
  private declarationService = new DeclarationService();

  /**
   * POST /api/autorites  (ADMIN) — create an authority
   */
  create = async (req: Request, res: Response) => {
    try {
      const errors = await validateDTO(req.body, CreateAutoriteDTO);
      if (errors) {
        return res.status(400).json({ success: false, errors });
      }
      const createdBy = (req as any).user?.id || (req as any).autorite?.id;
      const result = await this.service.create(req.body, createdBy);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * POST /api/autorites/login  (PUBLIC) — authority login
   */
  login = async (req: Request, res: Response) => {
    try {
      const errors = await validateDTO(req.body, LoginAutoriteDTO);
      if (errors) {
        return res.status(400).json({ success: false, errors });
      }
      const result = await this.service.login(req.body.email, req.body.mot_de_passe);
      res.cookie('autorite_token', result.token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  };

  /**
   * POST /api/autorites/logout  (PUBLIC) — clear auth cookie
   */
  logout = async (_req: Request, res: Response) => {
    res.clearCookie('autorite_token', { httpOnly: true, sameSite: 'lax' });
    res.json({ success: true, message: 'Déconnecté' });
  };

  /**
   * POST /api/autorites/change-password  (AUTORITE) — first login password change
   */
  changePassword = async (req: Request, res: Response) => {
    try {
      const errors = await validateDTO(req.body, ChangePasswordAutoriteDTO);
      if (errors) {
        return res.status(400).json({ success: false, errors });
      }
      const autorite = (req as any).autorite;
      const result = await this.service.changePassword(
        autorite.id,
        req.body.ancien_mot_de_passe,
        req.body.nouveau_mot_de_passe
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites/me  (AUTORITE) — current authority profile
   */
  me = async (req: Request, res: Response) => {
    try {
      const autorite = await this.service.findById((req as any).autorite.id);
      if (!autorite) {
        return res.status(404).json({ success: false, message: 'Autorité introuvable' });
      }
      res.json({ success: true, data: autorite });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites  (ADMIN / HAUTE) — list authorities
   */
  findAll = async (req: Request, res: Response) => {
    try {
      const { niveau, ville, is_active } = req.query;
      const list = await this.service.findAll({
        niveau: niveau as string | undefined,
        ville: ville as string | undefined,
        is_active: is_active === undefined ? undefined : is_active === 'true',
      });
      res.json({ success: true, count: list.length, data: list });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites/:id  (ADMIN / HAUTE) — authority detail
   */
  findById = async (req: Request, res: Response) => {
    try {
      const autorite = await this.service.findById(String(req.params.id));
      if (!autorite) {
        return res.status(404).json({ success: false, message: 'Autorité introuvable' });
      }
      res.json({ success: true, data: autorite });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * PUT /api/autorites/:id  (ADMIN) — update an authority
   */
  update = async (req: Request, res: Response) => {
    try {
      const errors = await validateDTO(req.body, UpdateAutoriteDTO);
      if (errors) {
        return res.status(400).json({ success: false, errors });
      }
      const updated = await this.service.update(String(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Autorité introuvable' });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * DELETE /api/autorites/:id  (ADMIN) — delete an authority
   */
  delete = async (req: Request, res: Response) => {
    try {
      const result = await this.service.delete(String(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites/declarations  (AUTORITE) — declarations visible to authority
   */
  getDeclarations = async (req: Request, res: Response) => {
    try {
      const autorite = (req as any).autorite;
      const list = await this.service.getDeclarations(autorite, req.query);
      res.json({ success: true, count: list.length, data: list });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * POST /api/autorites/declarations/:id/certify  (AUTORITE) — certify a declaration
   */
  certify = async (req: Request, res: Response) => {
    try {
      const autorite = (req as any).autorite;
      const updated = await this.service.certify(autorite, String(req.params.id));
      res.json({ success: true, message: 'Déclaration certifiée', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * POST /api/autorites/declarations/:id/uncertify  (HAUTE) — remove certification
   */
  uncertify = async (req: Request, res: Response) => {
    try {
      const autorite = (req as any).autorite;
      const updated = await this.service.uncertify(autorite, String(req.params.id));
      res.json({ success: true, message: 'Certification retirée', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * POST /api/autorites/create  (HAUTE) — haute creates a NORMAL authority
   */
  createByHaute = async (req: Request, res: Response) => {
    try {
      const errors = await validateDTO(req.body, CreateAutoriteDTO);
      if (errors) {
        return res.status(400).json({ success: false, errors });
      }
      const result = await this.service.createByHaute(req.body, (req as any).autorite.id);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites/managed  (HAUTE) — authorities created by the haute
   */
  getManaged = async (req: Request, res: Response) => {
    try {
      const autorite = (req as any).autorite;
      const list = await this.service.getManaged(autorite.id);
      res.json({ success: true, data: list });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * DELETE /api/autorites/managed/:id  (HAUTE) — delete an authority it created
   */
  deleteManaged = async (req: Request, res: Response) => {
    try {
      const autorite = (req as any).autorite;
      const result = await this.service.deleteManaged(autorite.id, String(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites/activity  (AUTORITE) — zone activity journal
   */
  getActivityLogs = async (req: Request, res: Response) => {
    try {
      const autorite = (req as any).autorite;
      const result = await this.service.getActivityLogs(autorite, (req as any).query);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites/stats  (AUTORITE) — dashboard stats
   */
  getStats = async (req: Request, res: Response) => {
    try {
      const autorite = (req as any).autorite;
      const stats = await this.service.getStats(autorite);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * GET /api/autorites/declarations/:id/pdf  (AUTORITE) — download declaration PDF
   */
  generatePdf = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const declaration = await this.declarationService.getDeclarationById(String(id));
      if (!declaration) {
        return res.status(404).json({ success: false, message: 'Déclaration introuvable' });
      }

      // Enrichir avec le nom du certificateur pour le cachet
      if (declaration.is_certified && declaration.certified_by) {
        try {
          const cert = await this.service.findCertificateur(declaration.certified_by);
          if (cert) declaration.certified_by_name = cert;
        } catch {}
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=declaration_${id}.pdf`);
      await this.pdfService.generateDeclarationPdf(declaration, res);
    } catch (error: any) {
      console.error('❌ [Autorites] Erreur génération PDF:', error.message);
      res.status(500).json({ success: false, message: 'Erreur lors de la génération du PDF' });
    }
  };
}
