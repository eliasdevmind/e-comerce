<template>
  <div class="admin-products">
    <h2>📦 Gerenciar Produtos</h2>
    <button @click="showAddProduct = !showAddProduct" class="btn-add">+ Novo Produto</button>

    <div v-if="showAddProduct" class="product-form">
      <h3>Adicionar Novo Produto</h3>
      <input v-model="newProduct.name" type="text" placeholder="Nome do produto">
      <input v-model="newProduct.price" type="number" placeholder="Preço">
      <input v-model="newProduct.category" type="text" placeholder="Categoria">
      <textarea v-model="newProduct.description" placeholder="Descrição"></textarea>
      <button @click="addProduct" class="btn-save">Salvar</button>
    </div>

    <table class="products-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Preço</th>
          <th>Categoria</th>
          <th>Estoque</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>#{{ product.id }}</td>
          <td>{{ product.name }}</td>
          <td>R$ {{ product.price.toFixed(2) }}</td>
          <td>{{ product.category }}</td>
          <td>{{ product.stock }}</td>
          <td>
            <button @click="editProduct(product.id)" class="btn-edit">✏️</button>
            <button @click="deleteProduct(product.id)" class="btn-delete">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'AdminProducts',
  data() {
    return {
      products: [],
      showAddProduct: false,
      newProduct: {
        name: '',
        price: '',
        category: '',
        description: ''
      },
      token: localStorage.getItem('token')
    };
  },
  methods: {
    async fetchProducts() {
      try {
        const response = await fetch('/api/products?limit=100', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        if (data.success) this.products = data.data;
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    async addProduct() {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newProduct)
        });
        const data = await response.json();
        if (data.success) {
          this.showAddProduct = false;
          this.newProduct = { name: '', price: '', category: '', description: '' };
          this.fetchProducts();
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    editProduct(productId) {
      alert(`Editar produto #${productId}`);
    },
    deleteProduct(productId) {
      if (!confirm('Tem certeza?')) return;
      alert(`Deletar produto #${productId}`);
    }
  },
  mounted() {
    this.fetchProducts();
  }
};
</script>

<style scoped>
.admin-products {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 25px;
}

h2 {
  color: var(--text-primary);
  margin-bottom: 20px;
}

.btn-add {
  padding: 10px 20px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 20px;
}

.product-form {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-form input,
.product-form textarea {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-save {
  padding: 10px 20px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.products-table {
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

.btn-edit, .btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  margin-right: 5px;
}

.btn-edit:hover {
  background-color: #3b82f6;
}

.btn-delete:hover {
  background-color: #ef4444;
  color: white;
}
</style>
