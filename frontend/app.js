const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      currentPage: 'home',
      user: null,
      token: localStorage.getItem('token') || null,
      cartCount: 0,
      
      // Home
      products: [],
      categories: [],
      searchQuery: '',
      selectedCategory: 'all',
      
      // Product Detail
      selectedProduct: null,
      quantity: 1,
      reviews: [],
      newReview: { rating: 5, title: '', comment: '' },
      
      // Cart
      cartItems: [],
      
      // Auth Forms
      authMode: 'login',
      formData: { email: '', password: '', name: '' },
      
      // Admin
      adminProducts: [],
      newProduct: { name: '', description: '', short_description: '', price: 0, discount_price: 0, category_id: 1, platform: '' },
      editingProduct: null,
      adminOrders: [],
      
      // Messages
      message: null,
      messageType: null,
      
      // Loading
      loading: false
    };
  },
  
  mounted() {
    this.loadCategories();
    if (this.token) {
      this.getCurrentUser();
      this.loadCart();
    }
  },
  
  computed: {
    filteredProducts() {
      let filtered = this.products;
      if (this.selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id == this.selectedCategory);
      }
      if (this.searchQuery) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      return filtered;
    }
  },
  
  methods: {
    // Navigation
    goToPage(page) {
      this.currentPage = page;
      if (page === 'admin') {
        this.loadAdminProducts();
        this.loadAdminOrders();
      }
    },
    
    // Auth
    async register() {
      try {
        await api.register(this.formData.email, this.formData.password, this.formData.name);
        this.showMessage('Cadastro realizado! Fazendo login...', 'success');
        setTimeout(() => this.login(), 1500);
      } catch (error) {
        this.showMessage(error.response?.data?.message || 'Erro ao cadastrar', 'error');
      }
    },
    
    async login() {
      try {
        const response = await api.login(this.formData.email, this.formData.password);
        this.token = response.data.token;
        this.user = response.data.user;
        localStorage.setItem('token', this.token);
        this.showMessage('Login realizado com sucesso!', 'success');
        this.currentPage = 'home';
        this.loadCart();
      } catch (error) {
        this.showMessage(error.response?.data?.message || 'Erro ao fazer login', 'error');
      }
    },
    
    async getCurrentUser() {
      try {
        const response = await api.getProfile();
        this.user = response.data;
      } catch (error) {
        this.logout();
      }
    },
    
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      this.currentPage = 'home';
      this.cartItems = [];
      this.showMessage('Logout realizado', 'success');
    },
    
    // Products
    async loadProducts() {
      try {
        this.loading = true;
        const response = await api.getProducts({ category: this.selectedCategory, search: this.searchQuery });
        this.products = response.data;
      } catch (error) {
        this.showMessage('Erro ao carregar produtos', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    async loadCategories() {
      try {
        const response = await api.getProducts();
        const uniqueCategories = [...new Set(response.data.map(p => ({ id: p.category_id, name: p.category_id })))];
        this.loadProducts();
      } catch (error) {
        this.showMessage('Erro ao carregar categorias', 'error');
      }
    },
    
    async viewProduct(product) {
      try {
        this.loading = true;
        const response = await api.getProductById(product.id);
        this.selectedProduct = response.data;
        this.quantity = 1;
        this.reviews = this.selectedProduct.reviews || [];
        this.currentPage = 'product-detail';
      } catch (error) {
        this.showMessage('Erro ao carregar produto', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // Cart
    async addToCart() {
      if (!this.token) {
        this.authMode = 'login';
        this.currentPage = 'auth';
        this.showMessage('Faça login para adicionar ao carrinho', 'info');
        return;
      }
      
      try {
        await api.addToCart(this.selectedProduct.id, this.quantity);
        this.showMessage('Produto adicionado ao carrinho!', 'success');
        this.loadCart();
      } catch (error) {
        this.showMessage('Erro ao adicionar ao carrinho', 'error');
      }
    },
    
    async loadCart() {
      try {
        const response = await api.getCart();
        this.cartItems = response.data.items;
        this.cartCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
      }
    },
    
    async updateCartItem(itemId, quantity) {
      try {
        await api.updateCartItem(itemId, quantity);
        this.loadCart();
      } catch (error) {
        this.showMessage('Erro ao atualizar carrinho', 'error');
      }
    },
    
    async removeFromCart(itemId) {
      try {
        await api.removeFromCart(itemId);
        this.showMessage('Produto removido do carrinho', 'success');
        this.loadCart();
      } catch (error) {
        this.showMessage('Erro ao remover do carrinho', 'error');
      }
    },
    
    // Reviews
    async submitReview() {
      if (!this.token) {
        this.showMessage('Faça login para comentar', 'info');
        return;
      }
      
      try {
        await api.createReview(this.selectedProduct.id, this.newReview);
        this.showMessage('Comentário adicionado!', 'success');
        this.newReview = { rating: 5, title: '', comment: '' };
        this.viewProduct(this.selectedProduct);
      } catch (error) {
        this.showMessage(error.response?.data?.message || 'Erro ao adicionar comentário', 'error');
      }
    },
    
    // Orders
    async checkout() {
      if (!this.token) {
        this.currentPage = 'auth';
        this.authMode = 'login';
        return;
      }
      
      try {
        const shippingAddress = prompt('Endereço de entrega:');
        if (!shippingAddress) return;
        
        const response = await api.createOrder({
          shipping_address: shippingAddress,
          payment_method: 'credit_card'
        });
        
        this.showMessage(`Pedido criado: ${response.data.order.order_number}`, 'success');
        this.currentPage = 'checkout';
        this.loadCart();
      } catch (error) {
        this.showMessage(error.response?.data?.message || 'Erro ao criar pedido', 'error');
      }
    },
    
    // Admin
    async loadAdminProducts() {
      try {
        const response = await api.getProducts();
        this.adminProducts = response.data;
      } catch (error) {
        this.showMessage('Erro ao carregar produtos', 'error');
      }
    },
    
    async loadAdminOrders() {
      try {
        const response = await api.getAllOrders();
        this.adminOrders = response.data;
      } catch (error) {
        this.showMessage('Erro ao carregar pedidos', 'error');
      }
    },
    
    async saveProduct() {
      try {
        if (this.editingProduct) {
          await api.updateProduct(this.editingProduct.id, this.newProduct);
          this.showMessage('Produto atualizado!', 'success');
        } else {
          await api.createProduct(this.newProduct);
          this.showMessage('Produto criado!', 'success');
        }
        this.newProduct = { name: '', description: '', short_description: '', price: 0, discount_price: 0, category_id: 1, platform: '' };
        this.editingProduct = null;
        this.loadAdminProducts();
      } catch (error) {
        this.showMessage(error.response?.data?.message || 'Erro ao salvar produto', 'error');
      }
    },
    
    async deleteProduct(productId) {
      if (!confirm('Tem certeza?')) return;
      
      try {
        await api.deleteProduct(productId);
        this.showMessage('Produto deletado!', 'success');
        this.loadAdminProducts();
      } catch (error) {
        this.showMessage('Erro ao deletar produto', 'error');
      }
    },
    
    // Utilities
    showMessage(message, type = 'info') {
      this.message = message;
      this.messageType = type;
      setTimeout(() => {
        this.message = null;
      }, 3000);
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price);
    },
    
    getStatusBadge(status) {
      const badges = {
        'pending': 'warning',
        'processing': 'info',
        'shipped': 'info',
        'delivered': 'success',
        'cancelled': 'danger',
        'completed': 'success',
        'failed': 'danger'
      };
      return badges[status] || 'info';
    }
  }
});

app.mount('#app');
