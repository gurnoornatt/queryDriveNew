// Export API and Client classes
export { DoorDashAPI, doorDashAPI } from './api';
export { DoorDashClient } from './client';

// Export types
export * from './types';

// Re-export authentication utilities
export { 
  generateSignature, 
  getAuthHeaders, 
  verifyWebhookSignature,
  DD_API_BASE_URL
} from '../../utils/doorDashAuth'; 