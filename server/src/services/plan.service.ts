import { planRepository, Plan } from '../repositories/plan.repository.ts';

class PlanService {
  async getAllPlans() {
    const plans = await planRepository.findAll();
    return plans.filter((p) => p.id !== 'vip_promo_2m');
  }

  async getPlanById(id: string) {
    return await planRepository.findById(id);
  }

  async updatePlan(id: string, data: Partial<Plan>) {
    return await planRepository.update(id, data);
  }

  async createPlan(data: any) {
    return await planRepository.create(data);
  }

  async getFeatureDefinitions() {
    return await planRepository.getFeatureDefinitions();
  }
}

export const planService = new PlanService();
