import { Store } from './Store.js'; // Import Store.js for handling auth token and role

export default {
  data() {
    return {
      error: '',
    };
  },
  methods: {
    async logout() {
      try {
        const response = await fetch('/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Store.getAuthToken()}`, // Send JWT token for authentication
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Logout successful, clear stored auth token and role
          Store.logout();

          // Redirect to login page
          this.$router.push('/login');
        } else {
          this.error = data.message || 'Logout failed. Please try again.';
        }
      } catch (err) {
        this.error = 'An error occurred during logout. Please try again.';
        console.error(err);
      }
    },
  },
  template: `
    <div>
      <!-- Logout Button -->
      <button @click="logout" class="btn btn-danger">Logout</button>
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
    </div>
  `,
};
