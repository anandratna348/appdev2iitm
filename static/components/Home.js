export default {
  template: `
    <div class="home-container">
      <header class="home-header">
        <h1>Welcome to ServiceConnect</h1>
        <p>Your one-stop solution for professional and customer services.</p>
        <router-link to="/register" class="btn-get-started">Get Started</router-link>
      </header>
      <section class="home-services">
        <h2>Our Services</h2>
        <div class="services-grid">
          <div class="service-card">
            <h3>Cleaning Services</h3>
            <p>Professional cleaning for your home and office.</p>
          </div>
          <div class="service-card">
            <h3>Electrical Repairs</h3>
            <p>Certified electricians for all your electrical needs.</p>
          </div>
          <div class="service-card">
            <h3>Plumbing</h3>
            <p>Get expert plumbers to fix your pipes and fittings.</p>
          </div>
          <div class="service-card">
            <h3>Gardening</h3>
            <p>Beautify your garden with professional help.</p>
          </div>
        </div>
      </section>
      <footer class="home-footer">
        <p>&copy; 2024 ServiceConnect. All rights reserved.</p>
      </footer>
    </div>
  `,
};