// Authentication error handler utility
// Handles token expiration and redirects to login page

export function handleAuthError(response: Response, error: any): void {
  if (response.status === 401 || error.message === 'Token has expired' || error.message?.includes('expired')) {
    // Clear auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Show a brief message before redirect
      console.warn('Session expired, redirecting to login...');
      
      // Redirect to login page
      window.location.href = '/sign-in';
    }
    
    throw new Error('Session expired. Please sign in again.');
  }
}

// Check if error is authentication related
export function isAuthError(response: Response, error: any): boolean {
  return response.status === 401 || 
         error.message === 'Token has expired' || 
         error.message?.includes('expired') ||
         error.message?.includes('unauthorized');
}

// Generic API error handler with auth check
export function handleApiError(response: Response, error: any, defaultMessage: string = 'Request failed'): never {
  // Handle auth errors first
  handleAuthError(response, error);
  
  // Handle other errors
  throw new Error(error.message || defaultMessage);
}