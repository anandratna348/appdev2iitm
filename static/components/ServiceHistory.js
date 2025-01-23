export default {
    data() {
      return {
        serviceRequests: [], // Array to store service request history
        errorMessage: '', // Error message
        successMessage: '', // Success message for rating
      };
    },
  
    methods: {
      // Fetch service request history
      fetchServiceRequests() {
        fetch(`/customer_dashboard/service_history`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // JWT token
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
            this.errorMessage = 'Error fetching service requests: ' + error.message;
            console.error(error);
          });
      },
  
      // Submit rating for a completed service
      submitRating(serviceRequest) {
        if (!serviceRequest.id) {
          console.error("Missing service request ID:", serviceRequest);
          alert("Error: Unable to submit rating because the service request ID is missing.");
          return;
        }
      
        // Ensure rating is a number (convert string to number if necessary)
        const rating = Number(serviceRequest.rating);
      
        // Check if rating is valid (1 <= rating <= 5)
        if (isNaN(rating) || rating < 1 || rating > 5) {
          alert("Error: Rating must be a number between 1 and 5.");
          return;
        }
      
        const ratingData = {
          rating: rating, // The entered rating value
        };
      
        fetch(`/customer_dashboard/service_requests/rate/${serviceRequest.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(ratingData),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error("Failed to submit rating");
            }
            return res.json();
          })
          .then(() => {
            this.successMessage = `Successfully rated the service`;
            // Optionally refetch service requests to update ratings
            this.fetchServiceRequests();
          })
          .catch((error) => {
            this.errorMessage = `Error submitting rating: ${error.message}`;
          });
      },
      
     
  
    back(){
      window.location.href = '#/customer_dashboard/';
  },
      
    },
  
    mounted() {
      // Fetch service requests when component is mounted
      this.fetchServiceRequests();
    },
  
    template: `
      <div class="container">
        <h1>Service Request History</h1>
        <button  @click="back">Back</button>
        
        <!-- Success Message -->
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
  
        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>
  
        <!-- Service Requests Table -->
        <table class="table table-striped mt-4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Professional Name</th>
              <th>Service Name</th>
              <th>Date of Request</th>
              <th>Date of Completion</th>
              <th>Total Hour</th>
              <th>Total Amount</th>
              <th>Hourly Rate</th>
              <th>Status</th>
              <th>Rating</th>
              <th>     </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in serviceRequests" :key="request.id">
              <td>{{ request.id}}</td>
              <td>{{ request.customer_name }}</td>
              <td>{{ request.professional_name }}</td>
              <td>{{ request.service_name }}</td>
              <td>{{ new Date(request.date_of_request).toLocaleString() }}</td>
              <td>{{ request.date_of_completion ? new Date(request.date_of_completion).toLocaleString() : 'Pending' }}</td>
              <td>{{ request.total_hour }}</td>
              <td>{{ request.total_price }}</td>
              <td>{{ request.price_per_hour }}</td>
              <td>{{ request.status }}</td>
              <td>{{ request.ratings}} </td>
              
                <div v-if="request.status === 'completed'">
                  <input
                    type="number"
                    v-model="request.rating"
                    placeholder="Rate (1-5)"
                    class="form-control d-inline-block"
                    style="width: 80px;"
                  />
                  <button @click="submitRating(request)" class="btn btn-primary btn-sm ml-2">Submit</button>
                </div>
                <div v-else>
                  Not available
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  };
  