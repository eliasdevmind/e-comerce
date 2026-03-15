<template>
  <div class="admin-orders">
    <h2>🛒 Gerenciar Pedidos</h2>
    <div class="filters">
      <select v-model="statusFilter" @change="fetchOrders" class="filter-select">
        <option value="">Todos os status</option>
        <option value="pending">Pendente</option>
        <option value="shipped">Enviado</option>
        <option value="delivered">Entregue</option>
        <option value="cancelled">Cancelado</option>
      </select>
    </div>

    <table class="orders-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Total</th>
          <th>Status</th>
          <th>Data</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>#{{ order.id }}</td>
          <td>{{ order.user_name }}</td>
          <td>R$ {{ order.total_price.toFixed(2) }}</td>
          <td>
            <select :value="order.status" @change="updateOrderStatus(order.id, $event.target.value)" class="status-select">
              <option value="pending">Pendente</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </td>
          <td>{{ formatDate(order.created_at) }}</td>
          <td><button @click="viewOrder(order.id)" class="btn-view">👁️</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'AdminOrders',
  data() {
    return {
      orders: [],
      statusFilter: '',
      token: localStorage.getItem('token')
    };
  },
  methods: {
    async fetchOrders() {
      try {
        const params = new URLSearchParams({
          limit: 50,
          ...(this.statusFilter && { status: this.statusFilter })
        });
        const response = await fetch(`/api/orders?${params}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) this.orders = data.data.data;
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    async updateOrderStatus(orderId, status) {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        });
        const data = await response.json();
        if (data.success) this.fetchOrders();
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    viewOrder(orderId) {
      alert(`Detalhes do pedido #${orderId}`);
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('pt-BR');
    }
  },
  mounted() {
    this.fetchOrders();
  }
};
</script>

<style scoped>
.admin-orders {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 25px;
}

h2 {
  color: var(--text-primary);
  margin-bottom: 20px;
}

.filters {
  margin-bottom: 20px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: var(--bg-tertiary);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

th {
  font-weight: 600;
  color: var(--text-primary);
}

.status-select {
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-view {
  padding: 6px 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
