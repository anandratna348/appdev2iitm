export default {
  name: 'AdminDashboard',
  data() {
    return {
      // Unique IDs for the buttons
      customersBtnId: 'view-customers-btn',
      professionalsBtnId: 'manage-professionals-btn',
      services: [], // To hold the list of services
      newService: {
        id: null, // Add an ID property to identify the service being updated
        name: '',
        description: '',
        time_required: '',
        price: 0,
      },
      updateMode: false, // Flag to check if we are in update mode
    };
  },
  mounted() {
    this.fetchServices();
  },
  methods: {
    viewCustomers() {
      window.location.href ='#/admin_dashboard/view_cutomers';
    },
    manageProfessionals() {
      window.location.href ='#/admin_dashboard/manage_professional';
    },
    viewReport() {
      window.location.href ='#/admin_dashboard/service_frequency';
    },
    exportServiceRequests() {
      fetch("/admin/export-closed-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to trigger service request export.");
          }
          return res.blob(); // Use blob for file download
        })
        .then((blob) => {
          // Create a temporary link to trigger the file download
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "service_requests_export.csv"; // Specify the file name
          link.click();
        })
        .catch((error) => {
          console.error("Error triggering service request export:", error);
        });
    },
    fetchServices() {
      fetch("/admin_dashboard/services", {
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
          this.services = data;
        })
        .catch((error) => {
          console.error('Error fetching service requests:', error);
        });
    },
    deleteService(request_id) {
      fetch(`/admin_dashboard/delete_service/${request_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      .then(() => {
        this.fetchServices();
      })
      .catch((error) => console.error('Error deleting service:', error));
    },
    updateService(serviceId) {
      const updatedService = this.services.find((service) => service.id === serviceId);
      this.newService.id = updatedService.id; // Set the ID of the service being updated
      this.newService.name = updatedService.name;
      this.newService.description = updatedService.description;
      this.newService.time_required = updatedService.time_required;
      this.newService.price = updatedService.price;

      // Set updateMode to true, to indicate we are in update mode
      this.updateMode = true;
    },
    addService() {
      const method = this.updateMode ? 'PUT' : 'POST';
      const url = this.updateMode 
        ? `/admin_dashboard/update_service/${this.newService.id}` 
        : "/admin_dashboard/add_services";

      fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.newService), // Use newService for both adding and updating
      })
      .then(() => {
        this.fetchServices();
        this.newService = { id: null, name: '', description: '', time_required: '', price: 0 };
        this.updateMode = false; // Reset the update mode flag
      })
      .catch((error) => console.error('Error adding/updating service:', error));
    },
  },
  template: `
    <div class="admin-dashboard" id="admin-dashboard-unique">
      <h1 id="admin-dashboard-title-unique">Admin Dashboard</h1>
      <div class="dashboard-buttons" id="admin-dashboard-buttons-unique">
        <button @click="viewCustomers" class="btn btn-primary" :id="customersBtnId">
          View Customers
        </button>
        <button @click="manageProfessionals" class="btn btn-secondary" :id="professionalsBtnId">
          Manage Professionals
        </button>
        <button @click="viewReport" class="btn btn-secondary" :id="professionalsBtnId">
          View Report
        </button>
        <button @click="exportServiceRequests" class="btn btn-info" id="export-service-requests-btn">
          Export Service Requests
        </button>
      </div>
      
      <h2 id="services-section-title-unique">Services</h2>
      <table class="table" id="services-table-unique">
        <thead>
          <tr>
            <th id="service-id-header-unique">ID</th>
            <th id="service-name-header-unique">Name</th>
            <th id="service-description-header-unique">Description</th>
            <th id="service-time-header-unique">Time (Hr)</th>
            <th id="service-price-header-unique">Price</th>
            <th id="service-actions-header-unique">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in services" :key="service.id">
            <td>{{ service.id }}</td>
            <td>{{ service.name }}</td>
            <td>{{ service.description }}</td>
            <td>{{ service.time_required }}</td>
            <td>{{ service.price }}</td>
            <td>
              <button @click="updateService(service.id)" class="btn btn-warning" :id="'update-service-' + service.id">Update</button>
              <button @click="deleteService(service.id)" class="btn btn-danger" :id="'delete-service-' + service.id">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="add-new-service-title-unique">Add New Service</h3>
      <form @submit.prevent="addService" id="add-service-form-unique">
        <input type="text" v-model="newService.name" placeholder="Service Name" required id="new-service-name-unique" />
        <textarea v-model="newService.description" placeholder="Service Description" required id="new-service-description-unique"></textarea>
        <input type="text" v-model="newService.time_required" placeholder="Time" required id="new-service-time-unique" />
        <input type="number" v-model="newService.price" placeholder="Price" required id="new-service-price-unique" />
        <button type="submit" class="btn btn-success" id="add-service-button-unique">
          {{ updateMode ? 'Update Service' : 'Add Service' }}
        </button>
      </form>
    </div>
  `,
};
