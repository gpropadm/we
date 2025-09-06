// Mock do Redis para demonstração
class RedisMock {
  constructor() {
    this.data = new Map();
    this.hashes = new Map();
    this.lists = new Map();
  }

  async connect() {
    console.log('📡 Mock Redis conectado');
    return this;
  }

  async disconnect() {
    console.log('📡 Mock Redis desconectado');
    return this;
  }

  async hSet(key, field, value) {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    this.hashes.get(key).set(field, value);
    return 1;
  }

  async hGet(key, field) {
    const hash = this.hashes.get(key);
    return hash ? hash.get(field) : null;
  }

  async hGetAll(key) {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    
    const result = {};
    for (const [field, value] of hash) {
      result[field] = value;
    }
    return result;
  }

  async lPush(key, value) {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    this.lists.get(key).unshift(value);
    return this.lists.get(key).length;
  }

  async lRange(key, start, stop) {
    const list = this.lists.get(key);
    if (!list) return [];
    
    if (stop === -1) stop = list.length - 1;
    return list.slice(start, stop + 1);
  }

  async lTrim(key, start, stop) {
    const list = this.lists.get(key);
    if (!list) return;
    
    const trimmed = list.slice(start, stop + 1);
    this.lists.set(key, trimmed);
    return 'OK';
  }

  async keys(pattern) {
    const keys = [];
    for (const key of this.hashes.keys()) {
      if (pattern === '*' || key.includes(pattern.replace('*', ''))) {
        keys.push(key);
      }
    }
    return keys;
  }
}

// Função para criar cliente mock
function createClient() {
  return new RedisMock();
}

module.exports = { createClient };