class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  set(key, value, ttl = 3600) {
    this.cache.set(key, value);
    
    if (ttl) {
      const timeout = setTimeout(() => {
        this.cache.delete(key);
        this.ttls.delete(key);
      }, ttl * 1000);
      
      this.ttls.set(key, timeout);
    }
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  delete(key) {
    this.cache.delete(key);
    
    const timeout = this.ttls.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.ttls.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.ttls.forEach(timeout => clearTimeout(timeout));
    this.ttls.clear();
  }

  has(key) {
    return this.cache.has(key);
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  size() {
    return this.cache.size;
  }
}

module.exports = new CacheManager();
