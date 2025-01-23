export default {
  name: 'ProfessionalManagement',
  data() {
    return {
      professionals: [], // List of professionals
      errorMessage: '', // Error message for display
    };
  },
  mounted() {
    this.fetchProfessionals(); // Fetch professionals when the component mounts
  },
  methods: {
    // Fetch the list of professionals
    fetchProfessionals() {
      fetch("/admin_dashboard/manage_professional", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch professionals");
          }
          return res.json();
        })
        .then((data) => {
          this.professionals = data;
        })
        .catch((error) => {
          console.error("Error fetching professionals:", error);
          this.errorMessage = "Failed to load professional data. Please try again later.";
        });
    },

    // Toggle status (activate/deactivate)
    toggleProfessionalStatus(professionalId, newStatus) {
      fetch(`/admin_dashboard/professionals/${professionalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ active: newStatus }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to update status');
          }
          return res.json();
        })
        .then(() => {
          const updatedProfessional = this.professionals.find((prof) => prof.id === professionalId);
          if (updatedProfessional) {
            updatedProfessional.active = newStatus; // Update status locally
          }
        })
        .catch((error) => {
          console.error("Error updating professional status:", error);
          this.errorMessage = "Failed to update status. Please try again later.";
        });
    },

    // View history of a professional
    viewProfessionalHistory(professionalId) {
    
      this.$router.push({ name: 'HistoryProfessional', params: { id: professionalId } });
    },
    back(){
      window.location.href = '#/admin_dashboard/';
  },
  },
  template: `
    <div class="professional-management-container">
      <h1 class="professional-management-title">Professional Management</h1>
      <button  @click="back">Back</button>
      <!-- Display error message if there's an issue -->
      <div v-if="errorMessage" class="professional-error-message">
        {{ errorMessage }}
      </div>

      <!-- Professionals Table -->
      <table class="professional-table">
        <thead>
          <tr class="professional-table-header">
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Service Name</th>
            <th>Rating</th>
            <th>Experience</th>
            <th>Profile Updated</th>
            <th>Status</th>
            <th>Actions</th>
            <th>History</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="professional in professionals" :key="professional.id" class="professional-table-row">
            <td>{{ professional.id }}</td>
            <td>{{ professional.name }}</td>
            <td>{{ professional.phone }}</td>
            <td>{{ professional.service_name }}</td>
            <td>{{ professional.rating }}</td>
            <td>{{ professional.experience }}</td>
            <td>{{ professional.date_created }}</td>
            <td>{{ professional.status }}</td>

            <!-- Activate and Deactivate Buttons -->
            <td class="professional-actions">
              <button
                @click="toggleProfessionalStatus(professional.id, true)"
                class="btn btn-activate"
                :disabled="professional.status === 'active'"
              >
                Activate
              </button>
              <button
                @click="toggleProfessionalStatus(professional.id, false)"
                class="btn btn-deactivate"
                :disabled="professional.status === 'inactive'"
              >
                Deactivate
              </button>
            </td>

            <!-- View History Button -->
            <td>
              <button @click="viewProfessionalHistory(professional.id)" class="btn btn-history">
                View History
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
};
