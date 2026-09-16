const mongoClient = require('./mongodb_client');
const store = require('./store');
const {
  UserRepo,
  PresentationRepo,
  AnalysisResultRepo,
  WeakSectionRepo,
  PracticeAttemptRepo
} = require('../models/repo');
const fs = require('fs');
const path = require('path');

class ServerDatabaseManager {
  constructor() {
    this.mongo = mongoClient;
    this.repos = {
      users: UserRepo,
      presentations: PresentationRepo,
      analysisResults: AnalysisResultRepo,
      weakSections: WeakSectionRepo,
      practiceAttempts: PracticeAttemptRepo
    };
  }

  /**
   * Initialize server database connections
   */
  async init() {
    await this.mongo.connect();
    return this.getStatus();
  }

  /**
   * Get server database health and repository counts
   */
  async getStatus() {
    const mongoStatus = this.mongo.getStatus();
    const userCount = (await UserRepo.find()).length;
    const presentationCount = (await PresentationRepo.find()).length;
    const analysisCount = (await AnalysisResultRepo.find()).length;

    return {
      databaseEngine: mongoStatus.status,
      mongoConnected: mongoStatus.connected,
      collections: {
        users: userCount,
        presentations: presentationCount,
        analysisResults: analysisCount
      },
      storageLocation: mongoStatus.connected ? 'MongoDB Cluster / Service' : path.join(__dirname, '..', 'data', 'local_store.json'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export complete database snapshot for backup or portability
   */
  async exportSnapshot() {
    const users = await UserRepo.find();
    const presentations = await PresentationRepo.find();
    const analysisResults = await AnalysisResultRepo.find();
    const weakSections = await WeakSectionRepo.find();
    const practiceAttempts = await PracticeAttemptRepo.find();

    const snapshot = {
      exportedAt: new Date().toISOString(),
      counts: {
        users: users.length,
        presentations: presentations.length,
        analysisResults: analysisResults.length,
        weakSections: weakSections.length,
        practiceAttempts: practiceAttempts.length
      },
      data: {
        users,
        presentations,
        analysisResults,
        weakSections,
        practiceAttempts
      }
    };

    const backupDir = path.join(__dirname, '..', 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `db_backup_${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');

    return { filename, filepath, snapshot };
  }
}

const serverDB = new ServerDatabaseManager();

module.exports = serverDB;
