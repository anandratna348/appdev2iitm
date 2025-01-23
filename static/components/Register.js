export default ({
    data: () => ({
        userData: {
            email: '',
            password: '',
            role: '', // Dropdown for 'professional' or 'customer'
        },
        registrationSuccess: false,
        registrationError: ''
    }),
    methods: {
        async registerUser() {
            // Validate form data before sending
            if (!this.userData.email || !this.userData.password || !this.userData.role) {
                this.registrationError = 'All fields are required.';
                return;
            }

            // Prepare the data to be sent to the backend
            const payload = {
                email: this.userData.email,
                password: this.userData.password,
                role: this.userData.role
            };

            try {
                // Send POST request to the backend API for registration
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                // Check if registration was successful
                const data = await response.json();
                if (response.ok) {
                    this.registrationSuccess = true;
                    this.registrationError = '';
                } else {
                    this.registrationError = data.message || 'Registration failed. May be user Already exist.';
                }
            } catch (error) {
                // Handle any errors that occur during the fetch
                this.registrationError = 'An error occurred. Please try again later.';
            }
        }
    },
    template: `
    <div class="register-container">
        <h2>User Registration</h2>
        
        <form @submit.prevent="registerUser" class="register-form">
            <div class="form-group">
                <label for="email">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    v-model="userData.email" 
                    placeholder="Enter your email" 
                    required 
                />
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    v-model="userData.password" 
                    placeholder="Enter your password" 
                    required
                />
            </div>

            <div class="form-group">
                <label for="role">Role</label>
                <select 
                    id="role" 
                    v-model="userData.role" 
                    required
                >
                    <option value="" disabled>Select your role</option>
                    <option value="professional">Professional</option>
                    <option value="customer">Customer</option>
                </select>
            </div>

            <button type="submit" class="btn-submit">Register</button>
        </form>

        <!-- Success/Error Message -->
        <div v-if="registrationSuccess" class="success-message">
            Registration successful! You can now log in.
        </div>
        <div v-if="registrationError" class="error-message">
            {{ registrationError }}
        </div>
    </div>
    `
});
