export default {
    name: 'AdminCustomersRequest',
    data() {
      return {
        serviceRequests: [],
      };
    },
    mounted() {
      const customerId = this.$route.params.id;  // Ensure the ID is being logged
      this.fetchServiceRequests(customerId); // Pass the customerId to fetch service requests
    },
    methods: {
      fetchServiceRequests(customerId) {
        fetch(`/admin_dashboard/view_customers/services/${customerId}`, {
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
      previous(){
        window.location.href = '#/admin_dashboard/view_customers';
    },
    back(){
      window.location.href = '#/admin_dashboard/';
  },
    },
    template: `
      <div class="customer-requests">
        <h4>Service Requests for Customer ID: {{ $route.params.id }}</h4>
        <button  @click="previous">Previous</button>
        <button  @click="back">Home</button>
        <table class="table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Professional Name</th>
              <th>Service Name</th>
              <th>Price Per Hour</th>
              <th>Date of Request</th>
              <th>Date of Completion</th>
              <th>Total Hours</th>
              <th>Total Price</th>
              <th>Ratings</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in serviceRequests" :key="request.id">
              <td>{{ request.customer_name}}</td>
              <td>{{ request.professional_name}}</td>
              <td>{{ request.service_name }}</td>
              <td>{{ request.price_per_hour }}</td>
              <td>{{ request.date_of_request }}</td>
              <td>{{ request.date_of_completion }}</td>
              <td>{{ request.total_hour }}</td>
              <td>{{ request.total_price }}</td>
              <td>{{ request.ratings }}</td>
              <td>{{ request.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  };
  