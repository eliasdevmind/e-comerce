<template>
  <div class="admin-analytics">
    <h2>📈 Analytics Avançado</h2>
    
    <div class="analytics-tabs">
      <button 
        @click="activeTab = 'revenue'"
        :class="{ active: activeTab === 'revenue' }"
        class="tab-btn"
      >
        💰 Receita
      </button>
      <button 
        @click="activeTab = 'geographic'"
        :class="{ active: activeTab === 'geographic' }"
        class="tab-btn"
      >
        🗺️ Geográfico
      </button>
      <button 
        @click="activeTab = 'payment'"
        :class="{ active: activeTab === 'payment' }"
        class="tab-btn"
      >
        💳 Pagamentos
      </button>
    </div>

    <div v-if="activeTab === 'revenue'" class="tab-content">
      <h3>Tendência de Receita</h3>
      <table class="analytics-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Receita</th>
            <th>Pedidos</th>
            <th>Ticket Médio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in revenueTrend" :key="day.date">
            <td>{{ formatDate(day.date) }}</td>
            <td>R$ {{ day.revenue.toFixed(2) }}</td>
            <td>{{ day.orders }}</td>
            <td>R$ {{ (day.revenue / day.orders).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'geographic'" class="tab-content">
      <h3>Dados por Estado</h3>
      <table class="analytics-table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Cidade</th>
            <th>Clientes</th>
            <th>Receita</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(geo, idx) in geographicData" :key="idx">
            <td>{{ geo.state }}</td>
            <td>{{ geo.city }}</td>
            <td>{{ geo.customers }}</td>
            <td>R$ {{ geo.revenue.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'payment'" class="tab-content">
      <h3>Métodos de Pagamento</h3>
      <table class="analytics-table">
        <thead>
          <tr>
            <th>Método</th>
            <th>Transações</th>
            <th>Bem-sucedidas</th>
            <th>Receita</th>
            <th>Taxa de Sucesso</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="method in paymentMethods" :key="method.payment_method">
            <td>{{ method.payment_method }}</td>
            <td>{{ method.transactions }}</td>
            <td>{{ method.successful }}</td>
            <td>R$ {{ method.revenue.toFixed(2) }}</td>
            <td>{{ ((method.successful / method.transactions) * 100).toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminAnalytics',
  data() {
    return {
      activeTab: 'revenue',
      revenueTrend: [],
      geographicData: [],
      paymentMethods: [],
      token: localStorage.getItem('token')
    };
  },
  methods: {
    async fetchRevenueTrend() {
      try {
        const response = await fetch('/api/analytics/revenue-trend?days=30', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) this.revenueTrend = data.data;
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    async fetchGeographic() {
      try {
        const response = await fetch('/api/analytics/geographic', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) this.geographicData = data.data;
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    async fetchPaymentMethods() {
      try {
        const response = await fetch('/api/analytics/payment-methods?days=30', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) this.paymentMethods = data.data;
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('pt-BR');
    }
  },
  mounted() {
    this.fetchRevenueTrend();
    this.fetchGeographic();
    this.fetchPaymentMethods();
  }
};
</script>

<style scoped>
.admin-analytics {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 25px;
}

h2 {
  color: var(--text-primary);
  margin-bottom: 20px;
}

.analytics-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #dc2626;
  border-bottom-color: #dc2626;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

.tab-content h3 {
  color: var(--text-primary);
  margin-bottom: 15px;
}

.analytics-table {
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

tr:hover {
  background-color: var(--bg-tertiary);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .analytics-table {
    font-size: 12px;
  }

  th, td {
    padding: 8px;
  }
}
</style>
