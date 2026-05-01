/**
 * Admin API Service for DocMaster
 */
import { API_BASE_URL, getAuthHeaders } from './api.js';

export const adminService = {
  /**
   * Get subscription statistics for dashboard
   */
  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/admin/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des stats');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Admin Stats Error:', error);
      throw error;
    }
  },

  /**
   * Get all subscriptions for management list
   */
  async getAllSubscriptions() {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/admin/all`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des abonnements');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Admin Subscriptions Error:', error);
      throw error;
    }
  },

  /**
   * Update a subscription status
   */
  async updateSubscriptionStatus(id, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Update Status Error:', error);
      throw error;
    }
  },

  /**
   * Get all plans for administration
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
      console.error('Admin Plans Error:', error);
      throw error;
    }
  },

  /**
   * Update a plan configuration
   */
  async updatePlan(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du plan');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Update Plan Error:', error);
      throw error;
    }
  },

  /**
   * Create a new plan
   */
  async createPlan(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la création du plan');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Create Plan Error:', error);
      throw error;
    }
  },

  /**
   * Get all available feature definitions
   */
  async getFeatureDefinitions() {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/features/definitions`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des définitions');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Get Definitions Error:', error);
      throw error;
    }
  },
};
