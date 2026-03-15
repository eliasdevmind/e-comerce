<template>
  <div class="admin-dashboard">
    <h2>📊 Dashboard Principal</h2>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">🛍️</div>
        <div class="metric-info">
          <div class="metric-label">Pedidos Totais</div>
          <div class="metric-value">{{ metrics.total?.total_orders || 0 }}</div>
          <div class="metric-trend">{{ metrics.total?.completed_orders || 0 }} completados</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">💰</div>
        <div class="metric-info">
          <div class="metric-label">Receita (30d)</div>
          <div class="metric-value">R$ {{ (metrics.total?.total_revenue || 0).toFixed(2) }}</div>
          <div class="metric-trend">Ticket: R$ {{ (metrics.total?.avg_order_value || 0).toFixed(2) }}</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">👥</div>
        <div class="metric-info">
          <div class="metric-label">Clientes</div>
          <div class="metric-value">{{ metrics.users?.total_users || 0 }}</div>
          <div class="metric-trend">{{ metrics.users?.new_users || 0 }} novos</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📦</div>
        <div class="metric-info">
          <div class="metric-label">Produtos</div>
          <div class="metric-value">{{ metrics.products?.total_products || 0 }}</div>
          <div class="metric-trend">{{ metrics.products?.out_of_stock || 0 }} sem estoque</div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-container">
        <h3>Receita por Dia (últimos 30 dias)</h3>
        <canvas id="revenueChart"></canvas>
      </div>
      <div class="chart-container">
        <h3>Produtos Mais Vendidos</h3>
        <div class="products-list">
          <div v-for="product in topProducts" :key="product.id" class="product-item">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-bar">
              <div class="bar" :style="{ width: getPercentage(product.sales) + '%' }"></div>
            </div>
            <div class="product-stats">{{ product.sales }} vendas</div>
          </div>
        </div>
      </div>
    </div>

    <div class="events-grid">
      <div class="event-container">
        <h3>Segmentação de Clientes</h3>
        <div class="segments">
          <div v-for="segment in customerSegments" :key="segment.segment" class="segment">
            <span class="segment-name">{{ segment.segment }}</span>
            <span class="segment-count">{{ segment.customer_count }} clientes</span>
            <span class="segment-value">R$ {{ segment.avg_spent.toFixed(2) }} avg</span>
          </div>
        </div>
      </div>

      <div class="event-container">
        <h3>Funnel de Conversão (últimos 30 dias)</h3>
        <div class="funnel">
          <div v-for="(stage, index) in conversionFunnel" :key="index" class="funnel-stage">
            <div class="stage-label">{{ stage.stage }}</div>
            <div class="stage-count">{{ stage.count }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() {
    return {
      metrics: {},
      topProducts: [],
      customerSegments: [],
      conversionFunnel: [],
      token: localStorage.getItem('token')
    };
  },
  methods: {
    async fetchDashboard() {
      try {
        const response = await fetch('/api/analytics/dashboard?days=30', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) {
          this.metrics = data.data;
        }
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
      }
    },

    async fetchTopProducts() {
      try {
        const response = await fetch('/api/analytics/top-products?limit=5&days=30', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) {
          this.topProducts = data.data;
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    },

    async fetchCustomerSegments() {
      try {
        const response = await fetch('/api/analytics/customer-segments', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) {
          this.customerSegments = data.data;
        }
      } catch (error) {
        console.error('Erro ao buscar segmentos:', error);
      }
    },

    async fetchConversionFunnel() {
      try {
        const response = await fetch('/api/analytics/conversion-funnel?days=30', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) {
          this.conversionFunnel = data.data;
        }
      } catch (error) {
        console.error('Erro ao buscar funil:', error);
      }
    },

    getPercentage(value) {
      if (!this.topProducts.length) return 0;
      const max = Math.max(...this.topProducts.map(p => p.sales));
      return (value / max) * 100;
    }
  },
  mounted() {
    this.fetchDashboard();
    this.fetchTopProducts();
    this.fetchCustomerSegments();
    this.fetchConversionFunnel();
  }
};
</script>

<style scoped>
.admin-dashboard {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 25px;
}

h2 {
  color: var(--text-primary);
  margin-bottom: 25px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metric-card {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
}

.metric-icon {
  font-size: 32px;
}

.metric-info {
  flex: 1;
}

.metric-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #dc2626;
  margin: 5px 0;
}

.metric-trend {
  color: var(--text-secondary);
  font-size: 12px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.chart-container {
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
  padding: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.chart-container h3 {
  margin-top: 0;
  color: var(--text-primary);
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  display: grid;
  grid-template-columns: 150px 1fr 80px;
  gap: 10px;
  align-items: center;
}

.product-name {
  font-weight: 600;
  color: var(--text-primary);
}

.product-bar {
  height: 25px;
  background-color: var(--bg-secondary);
  border-radius: 5px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #dc2626, #ef4444);
  transition: width 0.3s ease;
}

.product-stats {
  text-align: right;
  color: var(--text-secondary);
  font-size: 12px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.event-container {
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
  padding: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.event-container h3 {
  margin-top: 0;
  color: var(--text-primary);
}

.segments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.segment {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  padding: 12px;
  background-color: var(--bg-secondary);
  border-radius: 5px;
  align-items: center;
}

.segment-name {
  font-weight: 600;
  color: var(--text-primary);
}

.segment-count {
  color: var(--text-secondary);
  font-size: 12px;
}

.segment-value {
  text-align: right;
  color: #dc2626;
  font-weight: 600;
}

.funnel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.funnel-stage {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--bg-secondary);
  border-radius: 5px;
}

.stage-label {
  font-weight: 600;
  color: var(--text-primary);
}

.stage-count {
  background-color: #dc2626;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .product-item {
    grid-template-columns: 1fr;
  }
}
</style>
