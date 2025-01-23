import router from './router.js'
import Navbar from './components/Navbar.js'



new Vue({
  el: '#app',
  template: `
    <div class="bg-dark min-vh">
      <div class="container">
        <Navbar :key='has_changed'/>
        <router-view class=""/>
      </div>
    </div>
`,
  router,
  components: {
    Navbar,
  },
  data: {
    has_changed: true,
  },
  watch: {
    $route(to, from) {
      this.has_changed = !this.has_changed
    },
  },
})