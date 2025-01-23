export default {
  name: 'CustomerManagement',
  data() {
    return {
      customers: [], // Holds the list of customers
      errorMessage: '', // Error message for display
    };
  },
  mounted() {
    this.fetchCustomers();
  },
  methods: {
    // Fetch the list of customers from the backend
    fetchCustomers() {
      fetch("/admin_dashboard/view_customers", { // Corrected endpoint typo
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch customers");
          }
          return res.json();
        })
        .then((data) => {
          console.log("Fetched customer data:", data); // Log response for debugging
          this.customers = data; // Assign response data
        })
        .catch((error) => {
          console.error("Error fetching customers:", error);
          this.errorMessage = "Failed to load customer data. Please try again later.";
        });
    },
    // Toggle customer active status
    toggleCustomerStatus(customerId, newStatus) {
      fetch(`/admin_dashboard/customer/${customerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ active: newStatus }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to update status");
          }
          return res.json();
        })
        .then(() => {
          const updatedCustomer = this.customers.find((cust) => cust.id === customerId);
          if (updatedCustomer) {
            updatedCustomer.active = newStatus; // Update status locally
          }
        })
        .catch((error) => {
          console.error("Error updating customer status:", error);
          this.errorMessage = "Failed to update status. Please try again later.";
        });
    },
    // Redirect to requested service details
    seeRequestedService(customerId) {
      this.$router.push({ name: "AdminCustomerRequest", params: { id: customerId } });
    },
    // Navigate back to admin dashboard
    back() {
      this.$router.push({ path: "/admin_dashboard/" });
    },
  },
  template: `
    <div class="admin-customer-management">
      <h1 id="customer-management-title">Customer Management</h1>
      <button @click="back">Back</button>

      <!-- Display error message if there's an issue -->
      <div v-if="errorMessage" class="alert alert-danger" id="customer-error-message">
        {{ errorMessage }}
      </div>

      <!-- Customers Table -->
      <table class="table" id="customers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Status</th>
            <th>Actions</th>
            <th>View History</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customers.length === 0">
            <td colspan="7">No customers found</td>
          </tr>
          <tr v-for="customer in customers" :key="customer.id">
            <td>{{ customer.id }}</td>
            <td>{{ customer.name }}</td>
            <td>{{ customer.phone }}</td>
            <td>{{ customer.address }}</td>
            <td>{{ customer.active ? 'Active' : 'Inactive' }}</td>
            <td>
              <button
                @click="toggleCustomerStatus(customer.id, true)"
                class="btn btn-success"
                :disabled="customer.active"
              >
                Activate
              </button>
              <button
                @click="toggleCustomerStatus(customer.id, false)"
                class="btn btn-danger"
                :disabled="!customer.active"
              >
                Deactivate
              </button>
            </td>
            <td>
              <button
                @click="seeRequestedService(customer.id)"
                class="btn btn-primary"
              >
                See Requested Services
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
};
