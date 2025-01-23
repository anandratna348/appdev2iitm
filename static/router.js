// Importing components
import Home from "./components/Home.js";
import Login from "./components/Login.js";
import Register from "./components/Register.js"
import AdminDashboard from "./components/AdminDashboard.js";
import ProfessionalDashboard from "./components/ProfessionalDashboard.js";
import CustomerDashboard from "./components/CustomerDashboard.js";
import UpdateProfessionalProfile from "./components/UpdateProfessionalProfile.js";
import UpdateCustomerProfile from "./components/UpdateCustomerProfile.js";
import ViewProfile from "./components/ViewProfile.js"
import ServiceHistory from "./components/ServiceHistory.js";
import Customers from "./components/Customers.js";
import AdminCustomersRequest from "./components/AdminCustomersRequest.js";
import ManageProfessional from "./components/ManageProfessional.js";
import HistoryProfessional from "./components/HistoryProfessional.js";
import ProfessionalServiceHistory from "./components/ProfessionalServiceHistory.js";
import AdminCharts from "./components/AdminCharts.js";
import Logout from "./components/Logout.js";
//import ServiceRequests from "./components/ServiceRequests.js";
//import ManageServices from "./components/ManageServices.js";
//import ViewProfile from "./components/ViewProfile.js";
//import EditProfile from "./components/EditProfile.js";

// Defining routes
const routes = [
    { path: "/", component: Home, name: "Home" },
    { path: "/login", component: Login, name: "Login" },
    { path: "/logout", component: Logout, name: "Logout"},
    { path: "/register", component: Register, name: "Register" },

    // Admin routes
    { path: "/admin_dashboard", component: AdminDashboard, name: "AdminDashboard" },
    { path: "/admin_dashboard/view_cutomers", component: Customers, name: "Customers" },
    { path: "/admin_dashboard/view_customers/services/:id", component: AdminCustomersRequest, name: "AdminCustomerRequest"},
    { path: "/admin_dashboard/manage_professional", component: ManageProfessional, name: "ManageProfessional" },
    { path: "/admin_dashboard/manage_professional/services/:id", component: HistoryProfessional, name: "HistoryProfessional"},
    { path: "/admin_dashboard/service_frequency", component: AdminCharts, name: "AdminCharts"},

    // Professional routes
    { path: "/professional_dashboard", component: ProfessionalDashboard, name: "ProfessionalDashboard" },
    { path: "/professional_dashboard/create_update_profile", component: UpdateProfessionalProfile, name: "UpdateProfessionalProfile"},
    { path: "/professional_dashboard/viewprofile", component: ViewProfile, name: "ViewProfile" },
    { path: "/professional_dashboard/history", component: ProfessionalServiceHistory, name: "ProfessionalServiceHistory"},

    // Customer routes
    { path: "/customer_dashboard", component: CustomerDashboard, name: "CustomerDashboard" },
    { path: "/customer_dashboard/update_profile", component: UpdateCustomerProfile, name: "UpdateCustomerProfile" },
    { path: "/customer_dashboard/service_history", component: ServiceHistory, name: "ServiceHistory"},
];

// Initializing Vue Router
const router = new VueRouter({
    routes,
});

// Role-based navigation guards
router.beforeEach((to, from, next) => {
    const isLoggedIn = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("role"); // Assume "admin", "professional", or "customer"

    // Pages accessible without login
    const publicPages = ["Home", "Login", "Register"];

    // Role-specific route restrictions
    const adminPages = ["AdminDashboard", "Customers", "AdminCustomerRequest", "ManageProfessional", "HistoryProfessional", "AdminCharts"];
    const professionalPages = ["ProfessionalDashboard", "UpdateProfessionalProfile", "ViewProfile", "ProfessionalServiceHistory"];
    const customerPages = ["CustomerDashboard","ServiceRequests", "UpdateCustomerProfile", "ServiceHistory"];

    if (!isLoggedIn && !publicPages.includes(to.name)) {
        // Redirect to login if not logged in and trying to access protected routes
        return next({ name: "Login" });
    }

    if (isLoggedIn) {
        if (
            (userRole === "admin" && !adminPages.includes(to.name) && !publicPages.includes(to.name)) ||
            (userRole === "professional" && !professionalPages.includes(to.name) && !publicPages.includes(to.name)) ||
            (userRole === "customer" && !customerPages.includes(to.name) && !publicPages.includes(to.name))
        ) {
            // Redirect to appropriate dashboard based on role if accessing unauthorized route
            if (userRole === "admin") return next({ name: "AdminDashboard" });
            if (userRole === "professional") return next({ name: "ProfessionalDashboard" });
            if (userRole === "customer") return next({ name: "CustomerDashboard" });
        }
    }

    // Allow navigation
    next();
});

export default router;
