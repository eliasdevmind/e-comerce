<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1>🛡️ Painel de Controle Admin</h1>
      <div class="header-actions">
        <button @click="toggleDarkMode" class="btn-theme">
          {{ isDarkMode ? '☀️ Claro' : '🌙 Escuro' }}
        </button>
        <button @click="logout" class="btn-logout">Sair</button>
      </div>
    </header>

    <nav class="admin-nav">
      <a 
        href="#/admin/dashboard"
        :class="{ active: activeTab === 'dashboard' }"
        @click.prevent="activeTab = 'dashboard'"
      >
        📊 Dashboard
      </a>
      <a 
        href="#/admin/users"
        :class="{ active: activeTab === 'users' }"
        @click.prevent="activeTab = 'users'"
      >
        👥 Usuários
      </a>
      <a 
        href="#/admin/products"
        :class="{ active: activeTab === 'products' }"
        @click.prevent="activeTab = 'products'"
      >
        📦 Produtos
      </a>
      <a 
        href="#/admin/orders"
        :class="{ active: activeTab === 'orders' }"
        @click.prevent="activeTab = 'orders'"
      >
        🛒 Pedidos
      </a>
      <a 
        href="#/admin/analytics"
        :class="{ active: activeTab === 'analytics' }"
        @click.prevent="activeTab = 'analytics'"
      >
        📈 Analytics
      </a>
    </nav>

    <main class="admin-content">
      <component :is="currentComponent" :key="activeTab" />
    </main>
  </div>
</template>

<script>
import AdminUsers from './components/AdminUsers.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import AdminProducts from './components/AdminProducts.vue';
import AdminOrders from './components/AdminOrders.vue';
import AdminAnalytics from './components/AdminAnalytics.vue';

export default {
  name: 'AdminPanel',
  components: {
    AdminUsers,
    AdminDashboard,
    AdminProducts,
    AdminOrders,
    AdminAnalytics
  },
  data() {
    return {
      activeTab: 'dashboard',
      isDarkMode: localStorage.getItem('theme') === 'dark'
    };
  },
  computed: {
    currentComponent() {
      const components = {
        dashboard: 'AdminDashboard',
        users: 'AdminUsers',
        products: 'AdminProducts',
        orders: 'AdminOrders',
        analytics: 'AdminAnalytics'
      };
      return components[this.activeTab];
    }
  },
  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-mode');
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    }
  },
  mounted() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }
  }
};
</script>

<style scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(220, 38, 38, 0.3);
}

.admin-header h1 {
  margin: 0;
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.btn-theme, .btn-logout {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-theme:hover, .btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.admin-nav {
  display: flex;
  gap: 0;
  background-color: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
}

.admin-nav a {
  padding: 15px 25px;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
}

.admin-nav a:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.admin-nav a.active {
  color: #dc2626;
  border-bottom-color: #dc2626;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .admin-nav {
    overflow-x: auto;
  }

  .admin-nav a {
    padding: 12px 15px;
  }

  .admin-content {
    padding: 15px;
  }
}

.dark-mode {
  --bg-primary: #0a0e27;
  --bg-secondary: #1a1f3a;
  --bg-tertiary: #252d4a;
  --text-primary: #e4e6eb;
  --text-secondary: #b0b3c1;
  --border-color: #374151;
}

.light-mode {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}
</style>
