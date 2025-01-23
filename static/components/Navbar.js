export default {
  data: () => ({
    isLoggedIn: !!localStorage.getItem("access_token"),
    role: localStorage.getItem("role"),
  }),
  methods: {
    logOutUser() {
      const confirmation = confirm("Are you sure you want to log out?");
      if (!confirmation) return;
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      this.$router.push({ name: "Login" });
    },
  },
  template: `
<nav class="navbar navbar-expand{-sm|-md|-lg|-xl} navbar-light ">
  <div class="navbar-container">
    <a class="navbar-brand fw-bold text-primary" href="#">
      <h2>ServiceConnect</h2>
    </a>
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
      aria-controls="navbarNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ms-auto">
        <template v-if="isLoggedIn">
          <li class="nav-item" v-if="role === 'admin'">
            <router-link to="/admin-dashboard" class="nav-link">Admin Dashboard</router-link>
          </li>
          <li class="nav-item" v-if="role === 'professional'">
            <router-link to="/professional-dashboard" class="nav-link">Professional Dashboard</router-link>
          </li>
          <li class="nav-item" v-if="role === 'customer'">
            <router-link to="/customer-dashboard" class="nav-link">Customer Dashboard</router-link>
          </li>
          <li class="nav-item">
            <button class="btn btn-outline-danger btn-sm ms-2" @click="logOutUser">
              Log Out
            </button>
          </li>
        </template>
        <template v-else>
          <li class="nav-item">
            <router-link to="/login" class="nav-link">Login</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/register" class="nav-link">Register</router-link>
          </li>
        </template>
      </ul>
    </div>
  </div>
</nav>
  `,
};
