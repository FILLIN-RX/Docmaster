/**
 * ═════════════════════════════════════════════════════════════════
 * API.JS - Central API Service Layer
 * Exports all core API calls to backend endpoints
 * ═════════════════════════════════════════════════════════════════
 */

import apiClient, { setAuthToken, clearAuthToken } from '../core/axios.js';

export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper to get authentication headers for fetch calls
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('docmaster_jwt_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * ────────────────────────────────────────────────────────────────
 * AUTHENTICATION ENDPOINTS
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 */
export async function registerUser(userData) {
  try {
    const response = await apiClient.post('auth/register', {
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      mot_de_passe: userData.mot_de_passe,
      telephone: userData.telephone || null,
      pays: userData.pays || 'Cameroun',
      ville: userData.ville || 'Yaoundé',
      parrain_id: userData.parrain_id || null,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Erreur lors de l\'inscription.';
    return { success: false, message };
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(email, mot_de_passe) {
  try {
    const response = await apiClient.post('auth/login', {
      email,
      mot_de_passe,
    });
    
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Erreur lors de la connexion.';
    return { success: false, message };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email) {
  try {
    const response = await apiClient.post('auth/forgot-password', { email });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Erreur lors de la demande de réinitialisation.';
    return { success: false, message };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
  try {
    const response = await apiClient.post('auth/reset-password', {
      token,
      newPassword,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Erreur lors de la réinitialisation.';
    return { success: false, message };
  }
}

/**
 * Logout user
 */
export function logout() {
  clearAuthToken();
  localStorage.removeItem('docmaster_user_session');
  window.location.href = '/login.html';
}

/**
 * ────────────────────────────────────────────────────────────────
 * USER PROFILE ENDPOINTS
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Get current user profile
 */
export async function getProfile() {
  try {
    const response = await apiClient.get('auth/profile');
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Erreur lors de la récupération du profil.';
    return { success: false, message };
  }
}

/**
 * Update user profile
 * @param {Object} userData - Profile data { nom, prenom, telephone, photo_profile: File }
 */
export async function updateProfile(userData) {
  console.log('🚀 [API] Mise à jour du profil avec:', userData);

  try {
    const formData = new FormData();
    
    // If it's already a FormData, we use it directly
    if (userData instanceof FormData) {
      const response = await apiClient.put('auth/profile', userData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data };
    }

    // Otherwise, build it from object
    for (const key in userData) {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
        console.log(`📝 Ajouté ${key}:`, userData[key]);
      }
    }

    const response = await apiClient.put('auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ [API] Profil mis à jour avec succès:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ [API] Erreur lors de la mise à jour du profil:', error);
    const message = error.response?.data?.error || 'Erreur lors de la mise à jour du profil.';
    return { success: false, message };
  }
}

/**
 * ────────────────────────────────────────────────────────────────
 * DOCUMENT ENDPOINTS
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Register a user's own document
 * @param {Object} docData - Document data
 */
export async function registerMyDocument(docData) {
  console.log('🚀 [API] Enregistrement d\'un document avec:', docData);

  try {
    const formData = new FormData();
    
    // If it's already a FormData, we use it directly
    if (docData instanceof FormData) {
      const response = await apiClient.post('documents', docData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data };
    }

    // Otherwise, build it from object
    for (const key in docData) {
      if (docData[key] !== null && docData[key] !== undefined) {
        formData.append(key, docData[key]);
        console.log(`📝 Ajouté ${key}:`, docData[key]);
      }
    }

    const response = await apiClient.post('documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ [API] Document enregistré avec succès:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ [API] Erreur lors de l\'enregistrement:', error);
    const message = error.response?.data?.message || 'Erreur lors de l\'enregistrement du document.';
    return { success: false, message };
  }
}

/**
 * Get list of user's documents
 */
export async function getMyDocuments() {
  try {
    const response = await apiClient.get('documents');
    return { 
      success: true, 
      data: response.data.data, 
      count: response.data.count || response.data.data.length 
    };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la récupération des documents.';
    return { success: false, message };
  }
}

/**
 * Delete a document
 * @param {string} id - Document ID
 */
export async function deleteDocument(id) {
  try {
    const response = await apiClient.delete(`documents/${id}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la suppression.';
    return { success: false, message };
  }
}

/**
 * ────────────────────────────────────────────────────────────────
 * DOCUMENT SHARING ENDPOINTS
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Create a shareable link for a document
 */
export async function shareDocument(documentId, daysValid = null) {
  try {
    const response = await apiClient.post(`shares/${documentId}`, { daysValid });
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la création du lien de partage.';
    return { success: false, message };
  }
}

/**
 * Get shared document info (Public)
 */
export async function getSharedDocument(token) {
  try {
    const response = await apiClient.get(`shares/public/${token}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Lien invalide ou expiré.';
    return { success: false, message };
  }
}

/**
 * Get all shares for a document
 */
export async function getDocumentShares(documentId) {
  try {
    const response = await apiClient.get(`shares/${documentId}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: 'Erreur lors de la récupération des partages.' };
  }
}

/**
 * Revoke a share link
 */
export async function revokeShare(shareId) {
  try {
    const response = await apiClient.delete(`shares/${shareId}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    return { success: false, message: 'Erreur lors de la révocation.' };
  }
}

/**
 * ────────────────────────────────────────────────────────────────
 * DEVICE ENDPOINTS
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Register a new device
 * @param {Object|FormData} deviceData - Device data
 */
export async function registerMyDevice(deviceData) {
  try {
    const response = await apiClient.post('devices', deviceData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'appareil.';
    return { success: false, message };
  }
}

/**
 * Get list of user's devices
 */
export async function getMyDevices() {
  try {
    const response = await apiClient.get('devices');
    return { 
      success: true, 
      data: response.data.data, 
      count: response.data.count || response.data.data.length 
    };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la récupération des appareils.';
    return { success: false, message };
  }
}

/**
 * Declare a device as lost
 */
export async function reportDeviceLost(id) {
  try {
    const response = await apiClient.patch(`devices/${id}/lost`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la déclaration de perte.';
    return { success: false, message };
  }
}

/**
 * Declare a device as found
 */
export async function reportDeviceFound(id) {
  try {
    const response = await apiClient.patch(`devices/${id}/found`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la mise à jour du statut.';
    return { success: false, message };
  }
}

/**
 * Verify a device by IMEI or Serial Number
 */
export async function verifyDevice(identifier) {
  try {
    const response = await apiClient.get(`devices/verify/${identifier}`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la vérification de l\'appareil.';
    return { success: false, message };
  }
}

/**
 * Delete a device
 */
export async function deleteDevice(id) {
  try {
    const response = await apiClient.delete(`devices/${id}`);
    return { success: true, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la suppression.';
    return { success: false, message };
  }
}

/**
 * ────────────────────────────────────────────────────────────────
 * DECLARATIONS ENDPOINTS (Lost/Found)
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Create a new lost declaration
 * @param {FormData} formData - Declaration data with photos
 */
export async function createLostDeclaration(formData) {
  try {
    const response = await apiClient.post('declarations/lost', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la déclaration de perte.';
    return { success: false, message };
  }
}

/**
 * Create a new found declaration
 * @param {FormData} formData - Declaration data with photos
 */
export async function createFoundDeclaration(formData) {
  try {
    const response = await apiClient.post('declarations/found', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la déclaration de trouvaille.';
    return { success: false, message };
  }
}

/**
 * Get current user's declarations
 */
export async function getMyDeclarations() {
  try {
    const response = await apiClient.get('declarations/me');
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la récupération des déclarations.';
    return { success: false, message };
  }
}

/**
 * ────────────────────────────────────────────────────────────────
 * NOTIFICATION ENDPOINTS
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Get all notifications for the user
 */
export async function getMyNotifications() {
  try {
    const response = await apiClient.get('notifications');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: 'Erreur lors de la récupération des notifications.' };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id) {
  try {
    const response = await apiClient.patch(`notifications/${id}/read`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: 'Erreur lors de la mise à jour de la notification.' };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const response = await apiClient.patch('notifications/read-all');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: 'Erreur lors de la mise à jour des notifications.' };
  }
}



/**
 * ────────────────────────────────────────────────────────────────
 * SUBSCRIPTION ENDPOINTS
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Subscribe to a plan
 * @param {string} planId - Plan ID ('standard', 'pro', 'vip')
 * @param {number} months - Duration in months
 */
export async function subscribeToPlan(planId, months = 1) {
  try {
    const response = await apiClient.post('subscriptions/subscribe', {
      planId,
      months
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la souscription.';
    return { success: false, message };
  }
}
