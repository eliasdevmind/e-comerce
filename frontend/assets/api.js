const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  // Auth
  register: (email, password, name) =>
    axios.post(`${API_BASE_URL}/auth/register`, { email, password, name }),
  login: (email, password) =>
    axios.post(`${API_BASE_URL}/auth/login`, { email, password }),
  getProfile: () =>
    axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  updateProfile: (data) =>
    axios.put(`${API_BASE_URL}/auth/profile`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),

  // Products
  getProducts: (params) =>
    axios.get(`${API_BASE_URL}/products`, { params }),
  getProductById: (id) =>
    axios.get(`${API_BASE_URL}/products/${id}`),
  createProduct: (data) =>
    axios.post(`${API_BASE_URL}/products`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }),
  updateProduct: (id, data) =>
    axios.put(`${API_BASE_URL}/products/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }),
  deleteProduct: (id) =>
    axios.delete(`${API_BASE_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  uploadImages: (productId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return axios.post(`${API_BASE_URL}/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  // Cart
  addToCart: (productId, quantity) =>
    axios.post(`${API_BASE_URL}/cart/add`, { product_id: productId, quantity }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  getCart: () =>
    axios.get(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  updateCartItem: (itemId, quantity) =>
    axios.put(`${API_BASE_URL}/cart/${itemId}`, { quantity }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  removeFromCart: (itemId) =>
    axios.delete(`${API_BASE_URL}/cart/${itemId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  clearCart: () =>
    axios.delete(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),

  // Reviews
  getReviews: (productId) =>
    axios.get(`${API_BASE_URL}/reviews/${productId}`),
  createReview: (productId, data) =>
    axios.post(`${API_BASE_URL}/reviews/${productId}`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  updateReview: (reviewId, data) =>
    axios.put(`${API_BASE_URL}/reviews/${reviewId}`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  deleteReview: (reviewId) =>
    axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),

  // Orders
  createOrder: (data) =>
    axios.post(`${API_BASE_URL}/orders/create`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  getOrders: () =>
    axios.get(`${API_BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  getOrderDetails: (orderId) =>
    axios.get(`${API_BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  getAllOrders: (params) =>
    axios.get(`${API_BASE_URL}/orders/admin/all`, {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
  updateOrderStatus: (orderId, status) =>
    axios.put(`${API_BASE_URL}/orders/admin/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
};
