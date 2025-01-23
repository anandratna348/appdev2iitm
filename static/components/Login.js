import { Store } from './Store.js'; // Import the Store.js for token and role handling

export default {
  data: () => ({
    user: {
      email: '',
      password: '',
    },
    message: '', // To display success or failure message
    isLoading: false, // Show loading spinner during API request
  }),
  methods: {
    async login() {
      this.message = ''; // Clear any previous messages
      this.isLoading = true; // Show loading spinner

      try {
        // Send login request to the backend
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.user),
        });

        const data = await response.json();

        if (response.ok) {
          // Login success
          this.message = 'Login successful!';
          Store.setAuthToken(data.access_token); // Store the JWT token
          Store.setRole(data.role); // Store the user role

          // Redirect based on user role
          const routes = {
            admin: '/admin_dashboard',
            professional: '/professional_dashboard',
            customer: '/customer_dashboard',
          };
          this.$router.push({ path: routes[data.role] || '/login' });
        } else {
          // Login failed
          this.message = data.message || 'Login failed. Please check your credentials or Account Revoked!.';
        }
      } catch (error) {
        // Handle errors like network failure
        this.message = 'An error occurred. Please try again later.';
        console.error(error);
      } finally {
        this.isLoading = false; // Stop loading spinner
      }
    },
  },
  template: `
  <div class="login-container">
    <div class="login-card shadow">
      <h2 class="text-center mb-4">Login</h2>

      <!-- Show success or error message -->
      <div v-if="message" class="alert" :class="{'alert-success': isLoading === false && message === 'Login successful!', 'alert-danger': message !== 'Login successful!'}">
        {{ message }}
      </div>

      <div class="form-group mb-3">
        <label for="email" class="form-label">Email</label>
        <input
          id="email"
          type="email"
          class="form-control"
          v-model="user.email"
          placeholder="Enter your email"
          required
        />
      </div>
      <div class="form-group mb-4">
        <label for="password" class="form-label">Password</label>
        <input
          id="password"
          type="password"
          class="form-control"
          v-model="user.password"
          placeholder="Enter your password"
          required
        />
      </div>

      <!-- Show loading spinner during login -->
      <button 
        class="btn btn-primary w-100" 
        :disabled="isLoading" 
        @click="login">
        <span v-if="isLoading">Logging in...</span>
        <span v-else>Login</span>
      </button>

      <div class="text-center mt-3">
        <p>
          Don't have an account? <router-link to="/register">Register</router-link>
        </p>
      </div>
    </div>
  </div>
  `,
};
