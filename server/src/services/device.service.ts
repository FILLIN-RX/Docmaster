import { deviceRepository, Device } from '../repositories/device.repository.ts';

class DeviceService {
  async registerDevice(deviceData: Device) {
    return await deviceRepository.create(deviceData);
  }

  async getUserDevices(userId: string) {
    return await deviceRepository.findByUserId(userId);
  }

  async getDeviceById(id: string) {
    return await deviceRepository.findById(id);
  }

  async reportLost(id: string, userId: string) {
    const device = await deviceRepository.findById(id);
    if (!device || device.user_id !== userId) {
      throw new Error('Appareil non trouvé ou accès refusé');
    }
    return await deviceRepository.updateStatus(id, 'LOST');
  }

  async reportFound(id: string, userId: string) {
    const device = await deviceRepository.findById(id);
    if (!device || device.user_id !== userId) {
      throw new Error('Appareil non trouvé ou accès refusé');
    }
    return await deviceRepository.updateStatus(id, 'SAFE');
  }

  async deleteDevice(id: string, userId: string) {
    return await deviceRepository.delete(id, userId);
  }

  async verifyDevice(identifier: string) {
    const device = await deviceRepository.findAnyByIdentifier(identifier);
    if (!device) return null;

    // Obfuscate owner name for privacy if needed, or return relevant info
    return {
      id: device.id,
      brand: device.brand,
      model: device.model,
      category: device.category,
      status: device.status,
      owner: `${device.owner_first_name} ${device.owner_last_name.substring(0, 1)}.`,
      is_reported: device.status === 'LOST' || device.status === 'STOLEN'
    };
  }
}

export const deviceService = new DeviceService();
