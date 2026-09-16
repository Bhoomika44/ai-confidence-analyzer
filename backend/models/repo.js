const { getIsConnected } = require('../config/db');
const store = require('../config/store');
const UserMongoose = require('./User');
const PresentationMongoose = require('./Presentation');
const AnalysisResultMongoose = require('./AnalysisResult');
const WeakSectionMongoose = require('./WeakSection');
const PracticeAttemptMongoose = require('./PracticeAttempt');

const createAdapter = (MongooseModel, storeCollection) => {
  return {
    async find(filter = {}) {
      if (getIsConnected()) {
        const results = await MongooseModel.find(filter).lean();
        return results.map(r => ({ ...r, id: r._id.toString() }));
      }
      return await storeCollection.find(filter);
    },

    async findOne(filter = {}) {
      if (getIsConnected()) {
        const r = await MongooseModel.findOne(filter).lean();
        return r ? { ...r, id: r._id.toString() } : null;
      }
      return await storeCollection.findOne(filter);
    },

    async findById(id) {
      if (getIsConnected()) {
        try {
          const r = await MongooseModel.findById(id).lean();
          return r ? { ...r, id: r._id.toString() } : null;
        } catch (e) {
          return null;
        }
      }
      return await storeCollection.findById(id);
    },

    async create(data) {
      if (getIsConnected()) {
        const doc = await MongooseModel.create(data);
        const r = doc.toObject();
        return { ...r, id: r._id.toString() };
      }
      return await storeCollection.create(data);
    },

    async findByIdAndUpdate(id, updates, options = { new: true }) {
      if (getIsConnected()) {
        try {
          const doc = await MongooseModel.findByIdAndUpdate(id, updates, { new: true }).lean();
          return doc ? { ...doc, id: doc._id.toString() } : null;
        } catch (e) {
          return null;
        }
      }
      return await storeCollection.findByIdAndUpdate(id, updates, options);
    },

    async findByIdAndDelete(id) {
      if (getIsConnected()) {
        try {
          const doc = await MongooseModel.findByIdAndDelete(id).lean();
          return doc ? { ...doc, id: doc._id.toString() } : null;
        } catch (e) {
          return null;
        }
      }
      return await storeCollection.findByIdAndDelete(id);
    },

    async deleteMany(filter = {}) {
      if (getIsConnected()) {
        return await MongooseModel.deleteMany(filter);
      }
      return await storeCollection.deleteMany(filter);
    }
  };
};

module.exports = {
  UserRepo: createAdapter(UserMongoose, store.Users),
  PresentationRepo: createAdapter(PresentationMongoose, store.Presentations),
  AnalysisResultRepo: createAdapter(AnalysisResultMongoose, store.AnalysisResults),
  WeakSectionRepo: createAdapter(WeakSectionMongoose, store.WeakSections),
  PracticeAttemptRepo: createAdapter(PracticeAttemptMongoose, store.PracticeAttempts)
};
