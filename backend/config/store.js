const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: require('crypto').randomUUID } : { v4: () => Math.random().toString(36).substring(2) + Date.now().toString(36) };

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'local_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultState = {
  users: [],
  presentations: [],
  analysisResults: [],
  weakSections: [],
  practiceAttempts: []
};

const readStore = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
      return { ...defaultState };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return { ...defaultState };
  }
};

const writeStore = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing store:', e);
  }
};

class Collection {
  constructor(collectionName) {
    this.name = collectionName;
  }

  async find(filter = {}) {
    const store = readStore();
    const items = store[this.name] || [];
    return items.filter(item => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    }).map(i => ({ ...i, id: i._id }));
  }

  async findOne(filter = {}) {
    const items = await this.find(filter);
    return items[0] || null;
  }

  async findById(id) {
    const store = readStore();
    const items = store[this.name] || [];
    const found = items.find(i => i._id === id || i.id === id);
    return found ? { ...found, id: found._id } : null;
  }

  async create(data) {
    const store = readStore();
    if (!store[this.name]) store[this.name] = [];
    const item = {
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    store[this.name].push(item);
    writeStore(store);
    return { ...item, id: item._id };
  }

  async findByIdAndUpdate(id, updates, options = { new: true }) {
    const store = readStore();
    const items = store[this.name] || [];
    const index = items.findIndex(i => i._id === id || i.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeStore(store);
    return { ...items[index], id: items[index]._id };
  }

  async findByIdAndDelete(id) {
    const store = readStore();
    const items = store[this.name] || [];
    const item = items.find(i => i._id === id || i.id === id);
    if (!item) return null;
    store[this.name] = items.filter(i => i._id !== id && i.id !== id);
    writeStore(store);
    return { ...item, id: item._id };
  }

  async deleteMany(filter = {}) {
    const store = readStore();
    let items = store[this.name] || [];
    const initialLen = items.length;
    items = items.filter(item => {
      for (const key of Object.keys(filter)) {
        if (item[key] === filter[key]) return false;
      }
      return true;
    });
    store[this.name] = items;
    writeStore(store);
    return { deletedCount: initialLen - items.length };
  }
}

module.exports = {
  Users: new Collection('users'),
  Presentations: new Collection('presentations'),
  AnalysisResults: new Collection('analysisResults'),
  WeakSections: new Collection('weakSections'),
  PracticeAttempts: new Collection('practiceAttempts')
};
