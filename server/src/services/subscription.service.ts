import { subscriptionRepository } from '../repositories/subscription.repository.ts';

class SubscriptionService {
  async getAllSubscriptions() {
    return await subscriptionRepository.findAll();
  }

  async getAdminStats() {
    return await subscriptionRepository.getAdminStats();
  }

  async updateSubscriptionStatus(id: string, status: string) {
    return await subscriptionRepository.updateStatus(id, status);
  }

  async getSubscriptionById(id: string) {
    return await subscriptionRepository.findById(id);
  }
}

export const subscriptionService = new SubscriptionService();
