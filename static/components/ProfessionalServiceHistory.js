export default {
    data() {
      return {
        history: [],
        error: null
      };
    },
    mounted() {
      this.fetchServiceHistory();
    },
    methods: {
      async fetchServiceHistory() {
        fetch("/professional_dashboard/history", { // Updated URL
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'role': localStorage.getItem('role'),
            },
          })
              .then((response) => {
                  if (!response.ok) {
                      throw new Error("No service History found for this professional");
                  }
                  return response.json();
              })
              .then((data) => {
                  this.history = data; 
                  
              })
              .catch((err) => {
                  this.error = err.message; // Capture the error
              });
      },
      back(){
        window.location.href = '#/professional_dashboard/';
    },
      
    },
    template: `
      <div class="professional-service-history-container">
        <h2 class="professional-history-title">Professional Service History</h2>
        <button  @click="back">Back</button>
        <div v-if="error" class="error-message">{{ error }}</div>
          <thead>
            <tr>
              <th class="service-history-table-header">Customer Name</th>
              <th class="service-history-table-header">Professional Name</th>
              <th class="service-history-table-header">Service Name</th>
              <th class="service-history-table-header">Rating</th>
              <th class="service-history-table-header">Hourly Rate</th>
              <th class="service-history-table-header">Hours Worked</th>
              <th class="service-history-table-header">Total Price</th>
              <th class="service-history-table-header">Date of Request</th>
              <th class="service-history-table-header">Date of Completion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in history" :key="service.id">
              <td class="service-history-table-data">{{ service.customer_name }}</td>
              <td class="service-history-table-data">{{ service.professional_name }}</td>
              <td class="service-history-table-data">{{ service.service_name }}</td>
              <td class="service-history-table-data">{{ service.rating }}</td>
              <td class="service-history-table-data">{{ service.hourly_rate }}</td>
              <td class="service-history-table-data">{{ service.hours_worked }}</td>
              <td class="service-history-table-data">{{ service.total_price }}</td>
              <td class="service-history-table-data">{{ service.date_of_request }}</td>
              <td class="service-history-table-data">{{ service.date_of_completion || 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  };
  