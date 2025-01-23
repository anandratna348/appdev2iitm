export default {
    data() {
      return {
        name: '', // Customer's name
        phone: '', // Customer's phone
        address: '', // Customer's address
        successMessage: '', // Success message
        errorMessage: '', // Error message
      };
    },
  
    methods: {
      // Fetch existing profile data
      fetchProfile() {
        fetch(`/customer_dashboard/get_profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to fetch profile');
            }
            return res.json();
          })
          .then((data) => {
            this.name = data.name || '';
            this.phone = data.phone || '';
            this.address = data.address || '';
          })
          .catch((error) => {
            this.errorMessage = 'Error fetching profile: ' + error.message;
          });
      },
  
      // Submit updated profile
      updateProfile() {
        if (!this.name.trim() || !this.phone.trim() || !this.address.trim()) {
          alert("All fields are required.");
          return;
        }
  
        if (isNaN(this.phone) || this.phone.length !== 10) {
          alert("Please enter a valid 10-digit phone number.");
          return;
        }
  
        const updateData = {
          name: this.name,
          phone: this.phone,
          address: this.address,
        };
  
        fetch(`/customer_dashboard/update_profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify(updateData),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to update profile');
            }
            return res.json();
          })
          .then((data) => {
            this.successMessage = data.message || 'Profile updated successfully.';
          })
          .catch((error) => {
            this.errorMessage = 'Error updating profile: ' + error.message;
          });
      },
    },
  
    mounted() {
      this.fetchProfile();
    },
  
    template: `
      <div class="container">
        <h1>Update Profile</h1>
  
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
  
        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>
  
        <form @submit.prevent="updateProfile" class="form">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              type="text"
              id="name"
              v-model="name"
              placeholder="Enter your name"
              class="form-control"
              required
            />
          </div>
  
          <div class="form-group">
            <label for="phone">Phone</label>
            <input
              type="text"
              id="phone"
              v-model="phone"
              placeholder="Enter your phone number"
              class="form-control"
              required
            />
          </div>
  
          <div class="form-group">
            <label for="address">Address</label>
            <input
              type="text"
              id="address"
              v-model="address"
              placeholder="Enter your address"
              class="form-control"
              required
            />
          </div>
  
          <button type="submit" class="btn btn-primary mt-3">Update Profile</button>
        </form>
      </div>
    `,
  };
  