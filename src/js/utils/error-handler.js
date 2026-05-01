/**
 * ERROR-HANDLER.JS - Document & API Error Mapping
 * Translates technical or backend errors into user-friendly messages.
 */

const ERROR_MAP = {
  // Document specific errors
  'INVALID_FILE_TYPE': 'Le format du fichier n\'est pas supporté. Veuillez utiliser du JPG, PNG ou PDF.',
  'FILE_TOO_LARGE': 'Le fichier est trop volumineux (max 5 Mo).',
  'MISSING_PHOTO': 'Veuillez ajouter les deux faces du document (Recto et Verso).',
  'MISSING_FIELDS': 'Veuillez remplir tous les champs obligatoires.',
  'DOC_ALREADY_EXISTS': 'Un document avec ce numéro existe déjà dans votre coffre-fort.',
  
  // Generic API errors
  'UNAUTHORIZED': 'Votre session a expiré. Veuillez vous reconnecter.',
  'FORBIDDEN': 'Vous n\'avez pas la permission d\'effectuer cette action.',
  'SERVER_ERROR': 'Une erreur technique est survenue. Nos équipes ont été prévenues.',
  'NETWORK_ERROR': 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
  'TIMEOUT': 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
};

/**
 * Parses an error object and returns a human-readable message
 * @param {any} error - The error object from axios or catch block
 * @param {string} defaultMsg - Message to show if no match found
 * @returns {string}
 */
export function getFriendlyErrorMessage(error, defaultMsg = 'Une erreur inattendue est survenue.') {
  // 1. Check if it's a backend response with a specific message/code
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Check if backend sent a specific code we map
    if (data.code && ERROR_MAP[data.code]) {
      return ERROR_MAP[data.code];
    }
    
    // Check if backend sent a message directly
    if (data.message) {
      // If the message is already in French and looks like a user message, return it
      return data.message;
    }
  }

  // 2. Check for database-specific raw error messages (Postgres)
  const rawMessage = error?.response?.data?.message || error.message || '';
  if (rawMessage.includes('unique constraint') || rawMessage.includes('already exists')) {
    if (rawMessage.includes('numero_doc') || rawMessage.includes('fingerprint')) {
      return ERROR_MAP['DOC_ALREADY_EXISTS'];
    }
  }

  // 3. Check for Axios network errors
  if (error?.message === 'Network Error') {
    return ERROR_MAP['NETWORK_ERROR'];
  }
  
  if (error?.code === 'ECONNABORTED') {
    return ERROR_MAP['TIMEOUT'];
  }

  // 3. Map HTTP status codes
  if (error?.response?.status) {
    switch (error.response.status) {
      case 401: return ERROR_MAP['UNAUTHORIZED'];
      case 403: return ERROR_MAP['FORBIDDEN'];
      case 413: return ERROR_MAP['FILE_TOO_LARGE'];
      case 500: return ERROR_MAP['SERVER_ERROR'];
    }
  }

  return defaultMsg;
}

/**
 * Validation for file formats
 * @param {File} file 
 * @returns {string | null} Error message or null if valid
 */
export function validateDocumentFile(file) {
  if (!file) return null;
  
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return ERROR_MAP['INVALID_FILE_TYPE'];
  }
  
  if (file.size > maxSize) {
    return ERROR_MAP['FILE_TOO_LARGE'];
  }
  
  return null;
}
