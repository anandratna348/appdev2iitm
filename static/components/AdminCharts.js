export default {
    data() {
      return {
        serviceFrequencyData: [], // Data for service frequency
        completedRequestsData: [] // Data for completed requests
      };
    },
  
    methods: {
      // Function to fetch data from the backend
      fetchData() {
        // Fetch service frequency data
        fetch('/admin_dashboard/service_frequency', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            this.serviceFrequencyData = data;
            this.renderServiceFrequencyChart(); // Render chart after fetching data
          })
          .catch(error => {
            console.error('Error fetching service frequency data:', error);
          });
  
        // Fetch completed requests data
        fetch('/admin/dashboard/completed_requests', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            this.completedRequestsData = data;
            this.renderCompletedRequestsChart(); // Render chart after fetching data
          })
          .catch(error => {
            console.error('Error fetching completed requests data:', error);
          });
      },
  
      // Render the Service Frequency chart
      renderServiceFrequencyChart() {
        const labels = this.serviceFrequencyData.map(item => item.service_name);
        const data = this.serviceFrequencyData.map(item => item.count);
  
        const ctx = document.getElementById('serviceFrequencyChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Frequency of Services Requested',
              data: data,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      },
  
      // Render the Completed Requests chart
      renderCompletedRequestsChart() {
        const labels = this.completedRequestsData.map(item => item.status);
        const data = this.completedRequestsData.map(item => item.count);
  
        const ctx = document.getElementById('completedRequestsChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Completed vs Pending Requests',
              data: data,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    },
  
    mounted() {
      // Fetch data when the component is mounted
      this.fetchData();
    },
  
    template: `
      <div class="admin-dashboard-container">
        <h1>Admin Dashboard</h1>
  
        <!-- Bar Graph for Service Frequency -->
        <div class="chart-container">
          <canvas id="serviceFrequencyChart" width="400" height="200"></canvas>
        </div>
  
        <!-- Bar Graph for Completed Requests -->
        <div class="chart-container">
          <canvas id="completedRequestsChart" width="400" height="200"></canvas>
        </div>
  
        <button @click="fetchData" class="btn btn-primary">Reload Data</button>
      </div>
    `
  };
  