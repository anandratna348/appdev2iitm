export default {
    data: () => ({
        professionalInfo: {
            id: '',
            name: '',
            email: '',
            phone: '',
            service_type: '',
            experience: '',
            pincode: '',
            rating: 0,
            hourly_rate: '',  // Added hourly_rate
        },
        loading: true, // To handle loading state
        error: null,   // To display any fetch errors
    }),

    methods: {
        // Fetch Profile Information
        fetchProfile() {
            fetch("/professional_dashboard/viewprofile", { // Updated URL
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'role': localStorage.getItem('role'),
              },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch profile details");
                    }
                    return response.json();
                })
                .then((data) => {
                    this.professionalInfo = data; // Assign fetched data to professionalInfo
                    this.loading = false; // Mark as loaded
                })
                .catch((err) => {
                    this.error = err.message; // Capture the error
                    this.loading = false; // Stop loading even if there’s an error
                });
        },
        back(){
            window.location.href = '#/professional_dashboard/';
        },
    },

    mounted() {
        this.fetchProfile(); // Fetch data when the component is mounted
    },

    template: `
    <div class="container mt-4">
        <h2>Professional Profile</h2>
        <button  @click="back">Back</button>

        <!-- Loading State -->
        <div v-if="loading" class="alert alert-info">
            Loading profile details...
        </div>

        <!-- Error State -->
        <div v-if="error" class="alert alert-danger">
            {{ error }}
        </div>

        <!-- Profile Details -->
        <div v-if="!loading && !error">
            <table class="table table-bordered">
                <tbody>
                    <tr>
                        <td><b>ID:</b></td>
                        <td>{{ professionalInfo.id }}</td>
                    </tr>
                    <tr>
                        <td><b>Name:</b></td>
                        <td>{{ professionalInfo.name }}</td>
                    </tr>
                    <tr>
                        <td><b>Phone:</b></td>
                        <td>{{ professionalInfo.phone }}</td>
                    </tr>
                    <tr>
                        <td><b>Service Type:</b></td>
                        <td>{{ professionalInfo.service_type }}</td>
                    </tr>
                    <tr>
                        <td><b>Experience:</b></td>
                        <td>{{ professionalInfo.experience }} years</td>
                    </tr>
                    <tr>
                        <td><b>Pincode:</b></td>
                        <td>{{ professionalInfo.pincode }}</td>
                    </tr>
                    <tr>
                        <td><b>Rating:</b></td>
                        <td>{{ professionalInfo.rating }} / 5</td>
                    </tr>
                    <!-- Added Hourly Rate -->
                    <tr>
                        <td><b>Hourly Rate:</b></td>
                        <td>{{ professionalInfo.hourly_rate | currency }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `,
};
