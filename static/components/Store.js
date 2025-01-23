export const Store = {
    // Set the auth token in localStorage
    setAuthToken(access_token) {
      localStorage.setItem('access_token', access_token);
    },
  
    // Get the auth token from localStorage
    getAuthToken() {
      return localStorage.getItem('access_token');
    },
  
    // Set the user role in localStorage
    setRole(role) {
      localStorage.setItem('role', role);
    },
  
    // Get the user role from localStorage
    getRole() {
      return localStorage.getItem('role');
    },
  
    // Logout by clearing auth token and role from localStorage
    logout() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('role');
    }
  };
  
window.Store = Store;