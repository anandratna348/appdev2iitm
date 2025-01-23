export default {
    name: 'HistoryComponent',
    data() {
      return {
        history: [],
      };
    },
    mounted() {
        const professionalId = this.$route.params.id; 
        this.fetchServiceHistory(professionalId);
      // Fetch history when the component is mounte
    },
    methods: {
      // Fetch service request history for the given professional ID
      fetchServiceHistory(professionalId) {
        fetch(`/admin_dashboard/manage_professional/services/${professionalId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Failed to fetch service history');
            }
            return response.json();
          })
          .then((data) => {
            this.history = data; // Assign fetched data to history
            
          })
          .catch((error) => {
            console.error('Error fetching service history:', error);
          });
      },
      back(){
        window.location.href = '#/admin_dashboard/';
    },
    previous(){
        window.location.href = '#/admin_dashboard/manage_professional';
    },
    },
    template: `
      <div class="history-container-unique">
        <h2 class="history-title-unique">Service Request History</h2>
        <button  @click="back">Home</button>
        <button  @click="previous">Previous</button>
        <!-- History Table -->
          <thead>
            <tr class="history-header-row-unique">
              <th class="history-header-unique">Customer Name</th>
              <th class="history-header-unique">Professional Name</th>
              <th class="history-header-unique">Service Name</th>
              <th class="history-header-unique">Rating</th>
              <th class="history-header-unique">Hourly Rate</th>
              <th class="history-header-unique">Total Hours</th>
              <th class="history-header-unique">Total Amount</th>
              <th class="history-header-unique">Date of Request</th>
              <th class="history-header-unique">Date of Completion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in history" :key="record.id" class="history-row-unique">
              <td class="history-cell-unique">{{ record.customer_name }}</td>
              <td class="history-cell-unique">{{ record.professional_name }}</td>
              <td class="history-cell-unique">{{ record.service_name }}</td>
              <td class="history-cell-unique">{{ record.rating || 'N/A' }}</td>
              <td class="history-cell-unique">{{ record.hourly_rate }}</td>
              <td class="history-cell-unique">{{ record.hours_worked }}</td>
              <td class="history-cell-unique">{{ record.total_price }}</td>
              <td class="history-cell-unique">{{ record.date_of_request }}</td>
              <td class="history-cell-unique">{{ record.date_of_completion || 'Pending' }}</td>
            </tr>
          </tbody>
        </table>
  
        
      </div>
    `,
  };
  