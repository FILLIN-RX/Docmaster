/**
 * Plan Service for DocMaster
 */
import { API_BASE_URL, getAuthHeaders } from './api.js';

export const planService = {
  /**
   * Get all active plans for users
   */
  async getPlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des plans');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Plans Error:', error);
      throw error;
    }
  }
};
