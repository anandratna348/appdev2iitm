export default {
  data: () => ({
    professionalInfo: {
      name: '',
      email: '',
      phone: '',
      service_type: '',
      experience: '',
      pincode: '',
      rating: 0,
    },
    serviceRequests: [],
    updateSuccess: false,
    statusUpdateSuccess: false,
  }),

  computed: {
    role() {
      return localStorage.getItem('role');
    },
  },

  methods: {
    getProfessionalInfo() {
      fetch("/professional_dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch professional info');
          }
          return res.json();
        })
        .then((data) => {
          this.professionalInfo = data;
        })
        .catch((error) => {
          console.error('Error fetching professional info:', error);
        });
    },

    getServiceRequests() {
      fetch("/professional_dashboard/service_requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch service requests');
          }
          return res.json();
        })
        .then((data) => {
          this.serviceRequests = data;
        })
        .catch((error) => {
          console.error('Error fetching service requests:', error);
        });
    },

    acceptRequest(request_id) {
      fetch(`/professional_dashboard/service_requests/accept/${request_id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to accept request');
          }
          return res.json();
        })
        .then(() => {
          this.statusUpdateSuccess = true;
          this.getServiceRequests();
        })
        .catch((error) => {
          console.error('Error accepting request:', error);
        });
    },

    rejectRequest(request_id) {
      if (confirm('Are you sure you want to reject this service request?')) {
        fetch(`/professional_dashboard/service_requests/reject/${request_id}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to reject request');
            }
            return res.json();
          })
          .then(() => {
            this.statusUpdateSuccess = true;
            this.getServiceRequests();
          })
          .catch((error) => {
            console.error('Error rejecting request:', error);
          });
      }
    },

    completeRequest(request_id) {
      fetch(`/professional_dashboard/service_requests/complete/${request_id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to complete request');
          }
          return res.json();
        })
        .then(() => {
          this.statusUpdateSuccess = true;
          this.getServiceRequests();
        })
        .catch((error) => {
          console.error('Error completing request:', error);
        });
    },

    updateProfile() {
      window.location.href = '#/professional_dashboard/create_update_profile';
    },

    viewProfile() {
      window.location.href = '#/professional_dashboard/viewprofile';
    },
    viewHistory(){
      window.location.href = '#/professional_dashboard/history';
    }
  },

  mounted() {
    this.getProfessionalInfo();
    this.getServiceRequests();
  },

  template: `
    <div id="professional-dashboard">
      <div class="container">
        <h1>Professional Dashboard</h1>

        <!-- Professional Info Section -->
        <div class="rating-section mt-4">
          <h3>Professional Rating</h3>
          <p>Your Rating: {{ professionalInfo.rating }}/5</p>
          <div class="button-container mt-3">
            <button class="btn btn-primary btn-lg" @click="updateProfile">Update Profile</button>
            <button class="btn btn-secondary btn-lg" @click="viewProfile">View Profile</button>
            <button class="btn btn-secondary btn-lg" @click="viewHistory">View History</button>
          </div>
        </div>

        <!-- Service Requests Section -->
        <div class="service-requests-section mt-4">
          <h3>Service Requests</h3>
          <div v-if="serviceRequests.length === 0" class="alert alert-warning">
            No service requests available.
          </div>
          <div v-else>
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service Name</th>
                  <th>Customer Name</th>
                  <th>Phone Number and Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in serviceRequests" :key="request.id">
                  <td>{{ request.id }}</td>
                  <td>{{ request.serviceName }}</td>
                  <td>{{ request.customerName }}</td>
                  <td>{{ request.remarks }}</td>
                  <td>{{ request.service_status }}</td>
                  <td>
                    <button class="btn btn-success btn-sm" @click="acceptRequest(request.id)" :disabled="request.service_status !== 'requested'">Accept</button>
                    <button class="btn btn-primary btn-sm" @click="completeRequest(request.id)" :disabled="request.service_status !== 'in progress'">Complete</button>
                    <button class="btn btn-danger btn-sm" @click="rejectRequest(request.id)" :disabled="request.service_status !== 'requested' && request.service_status !== 'in progress'">Reject</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
};
