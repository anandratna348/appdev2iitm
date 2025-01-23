export default {
  data() {
    return {
      serviceName: '', // Input for the service name
      pincode: '', // Input for the pincode
      professionals: [], // Array to store search results
      noResults: false, // Flag for no results
      errorMessage: '', // Error message for failed fetches
      successMessage: '', // Success message after requesting a service
      customerRemarks: '', // Customer's Remarks
    };
  },

  methods: {
    // Method to search services by service name and/or pincode
    searchServices() {
      if (!this.serviceName.trim() && !this.pincode.trim()) {
        alert("Please enter either a service name or pincode to search.");
        return;
      }

      const queryParams = [];
      if (this.serviceName.trim()) {
        queryParams.push(`service_name=${this.serviceName}`);
      }
      if (this.pincode.trim()) {
        queryParams.push(`pincode=${this.pincode}`);
      }

      fetch(`/customer_dashboard/search_services?${queryParams.join('&')}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch services');
          }
          return res.json();
        })
        .then((data) => {
          if (data.length === 0) {
            this.noResults = true;
            this.professionals = [];
          } else {
            this.noResults = false;
            this.professionals = data;
          }
        })
        .catch((error) => {
          this.errorMessage = 'Error fetching services: ' + error.message;
          console.error('Error fetching services:', error);
        });
    },

    // Method to request a service
    requestService(professional) {
      if (!this.customerRemarks.trim()) {
        alert("Please provide remarks before requesting the service.");
        return;
      }

      const requestData = {
        service_name: professional.service_type, // Use service_type as service_name
        professional_id: professional.id,       // Professional's ID
        pincode: this.pincode,                  // Customer's Pincode
        remarks: this.customerRemarks,          // Customer's Remarks
      };

      fetch(`/customer_dashboard/request_service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(requestData),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to request service');
          }
          return res.json();
        })
        .then((data) => {
          this.successMessage = data.message;
          this.customerRemarks = '';
        })
        .catch((error) => {
          this.errorMessage = 'Error requesting service: ' + error.message;
        });
    },

    // Method to navigate to service history
    navigateToServiceHistory() {
      window.location.href = '#/customer_dashboard/service_history';
    },

    // Method to navigate to Update Profile
    navigateToUpdateProfile() {
      window.location.href = '#/customer_dashboard/update_profile';
    },
  },

  template: `
    <div class="container">
      <h1>Search Services</h1>

      <div class="form-group">
        <input
          type="text"
          v-model="serviceName"
          placeholder="Enter a service name"
          class="form-control"
        />
      </div>
       <div> Or </div>
      <div class="form-group">
        <input
          type="text"
          v-model="pincode"
          placeholder="Enter your pincode"
          class="form-control"
        />
      </div>

      <button @click="searchServices" class="btn btn-primary mt-2">Search</button>

      <div class="mt-4">
        <button @click="navigateToServiceHistory" class="btn btn-secondary">View Service History</button>
        <button @click="navigateToUpdateProfile" class="btn btn-update-profile">Update Profile</button>
      </div>

      <div v-if="successMessage" class="alert alert-success mt-3">
        {{ successMessage }}
      </div>

      <div v-if="noResults" class="alert alert-warning mt-3">
        No professionals found for the given search criteria.
      </div>

      <ul v-if="professionals.length" class="list-group mt-3">
        <li v-for="professional in professionals" :key="professional.id" class="list-group-item">
          <h5>{{ professional.name }}</h5>
          <p>Service: {{ professional.service_type }}</p>
          <p>Rating: {{ professional.rating }} ⭐</p>
          <p>Experience: {{ professional.experience }} years</p>
          <p>Phone: {{ professional.phone }}</p>
          <p>Price: {{ professional.service_price }}</p>

          <div class="form-group">
            <label for="pincode">Pincode</label>
            <input
              v-model="pincode"
              id="pincode"
              type="text"
              placeholder="Enter your pincode"
              class="form-control"
             />
          </div>


          <div class="form-group">
            <label for="customerRemarks">Phone Number and Address</label>
            <textarea
              v-model="customerRemarks"
              id="customerRemarks"
              rows="2"
              placeholder="Enter your remarks"
              class="form-control"
            ></textarea>
          </div>


          <button @click="requestService(professional)" class="btn btn-success mt-2">Request Service</button>
        </li>
      </ul>

      <div v-if="errorMessage" class="alert alert-danger mt-3">
        {{ errorMessage }}
      </div>
    </div>
  `,
};
