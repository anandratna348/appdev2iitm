export default {
  data() {
    return {
      professionalInfo: {
        name: '',
        phone: '',
        service_type: '',
        experience: '',
        pincode: '',
      },
      services: [], // List of available services fetched from the backend
      updateSuccess: false,
      updateError: false,
    };
  },
  methods: {
    // Fetch Professional Info
    getProfessionalInfo() {
      fetch("/professional_dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          this.professionalInfo = data;
        })
        .catch((error) => {
          console.error("Error fetching professional info:", error);
        });
    },

    // Fetch Available Services
    fetchAvailableServices() {
      fetch("/services", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch services");
          }
          return res.json();
        })
        .then((data) => {
          this.services = data; // Set the services directly as an array of strings
        })
        .catch((error) => {
          console.error("Error fetching services:", error);
        });
    },
    

    // Update Profile
    updateProfile() {
      console.log('Selected service_type:', this.professionalInfo.service_type); // Debug log
      fetch("/professional_dashboard/create_update_profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.professionalInfo),
      })
        .then((res) => {
          if (res.ok) {
            this.updateSuccess = true;
            setTimeout(() => {
              this.updateSuccess = false;
            }, 3000);
          } else {
            return res.json().then((data) => {
              console.error('Update error details:', data);
              throw new Error('Error updating profile');
            });
          }
        })
        .catch((error) => {
          console.error("Error updating profile:", error);
          this.updateError = true;
          setTimeout(() => {
            this.updateError = false;
          }, 3000);
        });
    },
    back(){
      window.location.href = '#/professional_dashboard/';
  },
  },
  mounted() {
    this.getProfessionalInfo();
    this.fetchAvailableServices();
  },
  template: `
    <div class="container">
      <h1>Update Profile</h1>
      <button  @click="back">Back</button>
      <form @submit.prevent="updateProfile">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" v-model="professionalInfo.name" required class="form-control" />
        </div>
        <div class="form-group">
          <label for="phone">Phone</label>
          <input type="text" id="phone" v-model="professionalInfo.phone" required class="form-control" />
        </div>
        <div class="form-group">
          <label for="service_type">Service Type</label>
          <select id="service_type" v-model="professionalInfo.service_type" required class="form-control">
            <option v-for="service in services" :key="service" :value="service">
              {{ service }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="experience">Experience (Years)</label>
          <input type="number" id="experience" v-model="professionalInfo.experience" class="form-control" />
        </div>
        <div class="form-group">
          <label for="pincode">Pincode</label>
          <input type="text" id="pincode" v-model="professionalInfo.pincode" required class="form-control" />
        </div>
        <button type="submit" class="btn btn-primary">Update Profile</button>
      </form>

      <div v-if="updateSuccess" class="alert alert-success mt-3">Profile updated successfully!</div>
      <div v-if="updateError" class="alert alert-danger mt-3">Error updating profile. Please try again later.</div>
    </div>
  `,
};
