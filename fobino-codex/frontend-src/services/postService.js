import api from '../config/api';

export const postService = {
  async getPosts(params = {}) {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  async getMyPosts(type = 'sell', params = {}) {
    const response = await api.get('/posts/my', {
      params: { type, ...params },
    });
    return response.data;
  },

  async getPost(postId) {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  async getPostBySlug(slug) {
    const response = await api.get(`/posts/slug/${slug}`);
    return response.data;
  },

  async getContactDetails(postId) {
    const response = await api.get(`/posts/${postId}/contact-details`);
    return response.data;
  },

  async getCategories(params = {}) {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  async getCategoriesTree() {
    const response = await api.get('/categories', {
      params: { tree: true },
    });
    return response.data;
  },

  async getSubcategories(categoryId) {
    const response = await api.get(`/categories/${categoryId}/subcategories`);
    return response.data;
  },

  async createPost(data, images = []) {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        if (Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  async updatePost(postId, data, newImages = []) {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    newImages.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.put(`/posts/${postId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  async updatePostStatus(postId, status) {
    const response = await api.put(`/posts/${postId}`, { status });
    return response.data;
  },

  async deletePost(postId) {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  async searchPosts(query, params = {}) {
    const response = await api.get('/posts/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  async markAsSold(postId) {
    const response = await api.post(`/posts/${postId}/sold`);
    return response.data;
  },

  async activateNardeban(postId, payload = {}) {
    const response = await api.post(`/posts/${postId}/nardeban`, payload);
    return response.data;
  },

  async activateSpecial(postId, payload = {}) {
    const response = await api.post(`/posts/${postId}/special`, payload);
    return response.data;
  },
};

export default postService;