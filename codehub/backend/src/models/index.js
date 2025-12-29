const sequelize = require('../config/database');
const User = require('./User');
const Repository = require('./Repository');
const Commit = require('./Commit');
const PullRequest = require('./PullRequest');
const Branch = require('./Branch'); // New model
const AdminLog = require('./AdminLog');
const Report = require('./Report');
const SystemSetting = require('./SystemSetting');

// --- Associations ---

// User <-> Repository
User.hasMany(Repository, { foreignKey: 'ownerId', as: 'repositories' });
Repository.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Repository <-> Branch (One-to-Many)
Repository.hasMany(Branch, { foreignKey: 'repoId', as: 'branchesList' }); // 'branches' conflict with logic?
Branch.belongsTo(Repository, { foreignKey: 'repoId' });

// Repository <-> Commit (Head)
Repository.belongsTo(Commit, { foreignKey: 'headCommitId', as: 'headCommit' });

// Repository Fork
Repository.belongsTo(Repository, { foreignKey: 'forkedFromId', as: 'forkedFrom' });

// Commit <-> Repository
Commit.belongsTo(Repository, { foreignKey: 'repoId' });
Repository.hasMany(Commit, { foreignKey: 'repoId', as: 'commits' });

// Commit <-> User (Author)
Commit.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// PullRequest <-> Repository
PullRequest.belongsTo(Repository, { foreignKey: 'repositoryId', as: 'repository' });
PullRequest.belongsTo(Repository, { foreignKey: 'sourceRepoId', as: 'sourceRepo' });
Repository.hasMany(PullRequest, { foreignKey: 'repositoryId', as: 'pullRequests' });

// PullRequest <-> User
PullRequest.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
PullRequest.belongsTo(User, { foreignKey: 'mergedById', as: 'mergedBy' });

// AdminLog <-> User
AdminLog.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

// Report <-> User
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

// Many-to-Many
Repository.belongsToMany(User, { through: 'RepositoryCollaborators', as: 'collaborators' });
User.belongsToMany(Repository, { through: 'RepositoryCollaborators', as: 'collaboratingRepos' });

Repository.belongsToMany(User, { through: 'RepositoryStars', as: 'stars' });
User.belongsToMany(Repository, { through: 'RepositoryStars', as: 'starredRepos' });

PullRequest.belongsToMany(User, { through: 'PullRequestReviewers', as: 'reviewers' });

// Sync Function to be called in server.js
const syncDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected via Sequelize');
        // alter: true updates tables to match models
        await sequelize.sync({ alter: true });
        console.log('Database Synced');
    } catch (err) {
        console.error('Database Connection Error:', err);
    }
};

module.exports = {
    sequelize,
    syncDB,
    User,
    Repository,
    Branch,
    Commit,
    PullRequest,
    AdminLog,
    Report,
    SystemSetting
};
