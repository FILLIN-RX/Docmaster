import { pool, query } from '../database/db.ts';
import { deviceTransferRepository } from '../repositories/device-transfer.repository.ts';
import { deviceRepository } from '../repositories/device.repository.ts';
import { mailService } from './mail.service.ts';
import { UserService } from './auth.service.ts';

const userService = new UserService();

class DeviceTransferService {
  async initiateTransfer(userId: string, deviceId: string, toEmail: string, password: string) {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');

    const isPasswordValid = await userService.verifyPassword(user.mot_de_passe, password);
    if (!isPasswordValid) throw new Error('Mot de passe incorrect');

    const device = await deviceRepository.findById(deviceId);
    if (!device) throw new Error('Appareil non trouvé');
    if (device.user_id !== userId) throw new Error('Vous n\'êtes pas le propriétaire de cet appareil');

    const isLost = ['LOST', 'STOLEN', 'VOLE', 'PERDU'].includes((device.status || '').toUpperCase());
    if (isLost) throw new Error('Impossible de transférer un appareil signalé comme perdu ou volé. Vous devez d\'abord le marquer comme retrouvé.');

    const userRes = await query('SELECT id, prenom, nom FROM users WHERE email = $1', [toEmail]);
    if (userRes.rows.length === 0) throw new Error('Aucun utilisateur DocMaster trouvé avec cet email');

    if (userRes.rows[0].id === userId) throw new Error('Vous ne pouvez pas transférer un appareil à vous-même');

    const existing = await deviceTransferRepository.findPendingByDevice(deviceId);
    if (existing) throw new Error('Un transfert est déjà en attente pour cet appareil');

    const transfer = await deviceTransferRepository.create(deviceId, userId, toEmail);

    const recipient = userRes.rows[0];
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3003'}/transfert-appareil?token=${transfer.token}`;

    await mailService.sendNotificationEmail(
      toEmail,
      `${recipient.prenom} ${recipient.nom}`,
      'Transfert d\'appareil',
      `Un utilisateur DocMaster vous a transféré un appareil (${device.brand} ${device.model}). Cliquez sur le bouton ci-dessous pour accepter ou refuser le transfert.`
    );

    try {
      const transporter = (mailService as any).transporter;
      await transporter.sendMail({
        from: `"DocMaster Transferts" <${process.env.MAIL_FROM || 'notifications@dm.cm'}>`,
        to: toEmail,
        subject: 'Transfert d\'appareil | DocMaster',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e0d8; border-radius: 14px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="width: 60px; height: 60px; background-color: #FEF0DC; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">📱</span>
              </div>
            </div>
            <h2 style="color: #f5a64b; text-align: center;">Transfert d'appareil</h2>
            <p>Bonjour ${recipient.prenom},</p>
            <p>Un utilisateur DocMaster souhaite vous transférer son appareil :</p>
            <div style="background-color: #faf8f5; border-radius: 10px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${device.brand} ${device.model}</p>
              <p style="margin: 5px 0 0; color: #64748b;">${device.category || 'Appareil'}</p>
            </div>
            <p>En acceptant, vous deviendrez le nouveau propriétaire de cet appareil sur DocMaster.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="background-color: #f5a64b; color: white; padding: 14px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Voir et répondre</a>
            </div>
            <p style="font-size: 12px; color: #8e8e8e;">Ce lien expirera dans 7 jours.</p>
            <hr style="border: 0; border-top: 1px solid #e5e0d8; margin: 20px 0;">
            <p style="font-size: 12px; color: #8e8e8e; text-align: center;">
              &copy; ${new Date().getFullYear()} DocMaster. Tous droits réservés.
            </p>
          </div>
        `
      });
    } catch (err: any) {
      console.error('❌ Erreur envoi email transfert:', err.message);
    }

    return { success: true, message: 'Demande de transfert envoyée', token: transfer.token };
  }

  async acceptTransfer(token: string, userId: string) {
    const transfer = await deviceTransferRepository.findByToken(token);
    if (!transfer) throw new Error('Demande de transfert introuvable');
    if (transfer.status !== 'PENDING') throw new Error('Cette demande de transfert n\'est plus valide');

    const userRes = await query('SELECT id FROM users WHERE email = $1', [transfer.to_email]);
    if (userRes.rows.length === 0) throw new Error('Destinataire introuvable');
    if (userRes.rows[0].id !== userId) throw new Error('Cet email ne correspond pas à votre compte');

    const device = await deviceRepository.findById(transfer.device_id);
    if (!device) throw new Error('Appareil introuvable');
    const isLost = ['LOST', 'STOLEN', 'VOLE', 'PERDU'].includes((device.status || '').toUpperCase());
    if (isLost) throw new Error('Cet appareil a été signalé comme perdu ou volé et ne peut pas être transféré.');

    await query('UPDATE my_devices SET user_id = $1 WHERE id = $2', [userId, transfer.device_id]);
    await deviceTransferRepository.updateStatus(transfer.id, 'ACCEPTED', userId);

    const fromUserRes = await query('SELECT email, prenom, nom FROM users WHERE id = $1', [transfer.from_user_id]);
    if (fromUserRes.rows.length > 0) {
      const fromUser = fromUserRes.rows[0];
      await mailService.sendNotificationEmail(
        fromUser.email,
        `${fromUser.prenom} ${fromUser.nom}`,
        'Transfert accepté',
        `Le transfert de votre appareil ${device.brand} ${device.model} a été accepté.`
      );
    }

    return { success: true, message: 'Appareil transféré avec succès' };
  }

  async rejectTransfer(token: string) {
    const transfer = await deviceTransferRepository.findByToken(token);
    if (!transfer) throw new Error('Demande de transfert introuvable');
    if (transfer.status !== 'PENDING') throw new Error('Cette demande de transfert n\'est plus valide');

    await deviceTransferRepository.updateStatus(transfer.id, 'REJECTED');

    const device = await deviceRepository.findById(transfer.device_id);
    const fromUserRes = await query('SELECT email, prenom, nom FROM users WHERE id = $1', [transfer.from_user_id]);
    if (fromUserRes.rows.length > 0) {
      const fromUser = fromUserRes.rows[0];
      await mailService.sendNotificationEmail(
        fromUser.email,
        `${fromUser.prenom} ${fromUser.nom}`,
        'Transfert refusé',
        `Le transfert de votre appareil ${device?.brand || ''} ${device?.model || ''} a été refusé par le destinataire.`
      );
    }

    return { success: true, message: 'Transfert refusé' };
  }

  async getTransferByToken(token: string) {
    const transfer = await deviceTransferRepository.findByToken(token);
    if (!transfer) throw new Error('Demande de transfert introuvable');
    if (transfer.status !== 'PENDING') throw new Error('Cette demande de transfert a expiré ou déjà été traitée');

    const device = await deviceRepository.findById(transfer.device_id);
    const fromUserRes = await query('SELECT prenom, nom FROM users WHERE id = $1', [transfer.from_user_id]);

    return {
      transfer: {
        id: transfer.id,
        status: transfer.status,
        created_at: transfer.created_at,
      },
      device: device ? { brand: device.brand, model: device.model, category: device.category } : null,
      from_user: fromUserRes.rows[0] || null
    };
  }

  async getPendingTransfers(email: string) {
    return await deviceTransferRepository.findPendingByEmail(email);
  }

  async getSentTransfers(userId: string) {
    return await deviceTransferRepository.findSentByUser(userId);
  }
}

export const deviceTransferService = new DeviceTransferService();
