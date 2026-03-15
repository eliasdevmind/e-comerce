<template>
  <div class="admin-users">
    <div class="users-header">
      <h2>Gerenciar Usuários</h2>
      <div class="filters">
        <input 
          v-model="filters.search"
          type="text"
          placeholder="🔍 Buscar por nome ou email..."
          class="search-input"
        />
        <select v-model="filters.role" class="filter-select">
          <option value="">Todas as funções</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderador</option>
          <option value="customer">Cliente</option>
        </select>
        <select v-model="filters.status" class="filter-select">
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="suspended">Suspenso</option>
        </select>
        <button @click="fetchUsers" class="btn-filter">Filtrar</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_users }}</div>
        <div class="stat-label">Total de Usuários</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.active }}</div>
        <div class="stat-label">Ativos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.suspended }}</div>
        <div class="stat-label">Suspensos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.new_30d }}</div>
        <div class="stat-label">Novos (30d)</div>
      </div>
    </div>

    <div class="users-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Função</th>
            <th>Status</th>
            <th>Data de Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="user-row">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <select 
                :value="user.role"
                @change="updateRole(user.id, $event.target.value)"
                class="role-select"
              >
                <option value="customer">Cliente</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td>
              <select 
                :value="user.status"
                @change="updateStatus(user.id, $event.target.value)"
                :class="['status-select', user.status]"
              >
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
              </select>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td class="actions">
              <button @click="viewDetails(user.id)" class="btn-view">👁️</button>
              <button @click="deleteUser(user.id)" class="btn-delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button @click="previousPage" :disabled="offset === 0">← Anterior</button>
      <span>Página {{ currentPage }} de {{ totalPages }}</span>
      <button @click="nextPage" :disabled="offset + limit >= stats.total_users">Próxima →</button>
    </div>

    <div v-if="selectedUserId" class="user-details-modal">
      <div class="modal-content">
        <button @click="selectedUserId = null" class="close-btn">✕</button>
        <h3>Detalhes do Usuário</h3>
        <div v-if="selectedUser" class="details">
          <p><strong>Nome:</strong> {{ selectedUser.name }}</p>
          <p><strong>Email:</strong> {{ selectedUser.email }}</p>
          <p><strong>Função:</strong> {{ selectedUser.role }}</p>
          <p><strong>Status:</strong> {{ selectedUser.status }}</p>
          <p><strong>Pedidos:</strong> {{ selectedUser.stats.total_orders }}</p>
          <p><strong>Gasto Total:</strong> R$ {{ selectedUser.stats.total_spent.toFixed(2) }}</p>
          <p><strong>Avaliações:</strong> {{ selectedUser.stats.total_reviews }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminUsers',
  data() {
    return {
      users: [],
      stats: {
        total_users: 0,
        active: 0,
        suspended: 0,
        new_30d: 0
      },
      filters: {
        search: '',
        role: '',
        status: ''
      },
      limit: 20,
      offset: 0,
      selectedUserId: null,
      selectedUser: null,
      token: localStorage.getItem('token')
    };
  },
  computed: {
    currentPage() {
      return Math.floor(this.offset / this.limit) + 1;
    },
    totalPages() {
      return Math.ceil(this.stats.total_users / this.limit);
    }
  },
  methods: {
    async fetchUsers() {
      try {
        const params = new URLSearchParams({
          limit: this.limit,
          offset: this.offset,
          ...(this.filters.search && { search: this.filters.search }),
          ...(this.filters.role && { role: this.filters.role }),
          ...(this.filters.status && { status: this.filters.status })
        });

        const response = await fetch(`/api/admin/users?${params}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const data = await response.json();
        if (data.success) {
          this.users = data.data.data;
          this.stats.total_users = data.data.total;
          await this.fetchStats();
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    },

    async fetchStats() {
      try {
        const response = await fetch('/api/admin/users/stats', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const data = await response.json();
        if (data.success) {
          this.stats = data.data;
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    },

    async updateRole(userId, newRole) {
      try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        });

        const data = await response.json();
        if (data.success) {
          this.fetchUsers();
        }
      } catch (error) {
        console.error('Erro ao atualizar função:', error);
      }
    },

    async updateStatus(userId, newStatus) {
      try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (data.success) {
          this.fetchUsers();
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    },

    async viewDetails(userId) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const data = await response.json();
        if (data.success) {
          this.selectedUser = data.data;
          this.selectedUserId = userId;
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
      }
    },

    async deleteUser(userId) {
      if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const data = await response.json();
        if (data.success) {
          this.fetchUsers();
        }
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('pt-BR');
    },

    nextPage() {
      this.offset += this.limit;
      this.fetchUsers();
    },

    previousPage() {
      this.offset = Math.max(0, this.offset - this.limit);
      this.fetchUsers();
    }
  },
  mounted() {
    this.fetchUsers();
    this.fetchStats();
  }
};
</script>

<style scoped>
.admin-users {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.users-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input, .filter-select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
}

.btn-filter {
  padding: 10px 20px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.users-table {
  overflow-x: auto;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: var(--bg-tertiary);
}

th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
}

td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
}

.user-row:hover {
  background-color: var(--bg-tertiary);
}

.role-select, .status-select {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.status-select.active {
  border-color: #10b981;
}

.status-select.suspended {
  border-color: #ef4444;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-view, .btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-view:hover {
  background-color: #3b82f6;
}

.btn-delete:hover {
  background-color: #ef4444;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.pagination button {
  padding: 10px 20px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-secondary);
  padding: 30px;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-content h3 {
  margin-top: 0;
  color: var(--text-primary);
}

.details p {
  margin: 10px 0;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .users-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    width: 100%;
  }

  table {
    font-size: 12px;
  }

  th, td {
    padding: 8px;
  }
}
</style>
