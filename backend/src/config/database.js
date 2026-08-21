require('reflect-metadata');
const { DataSource } = require('typeorm');
const env = require('./env');

const User = require('../entities/User');
const Skill = require('../entities/Skill');
const UserSkill = require('../entities/UserSkill');
const UserPortfolioLink = require('../entities/UserPortfolioLink');
const Category = require('../entities/Category');
const Project = require('../entities/Project');
const ProjectTechnology = require('../entities/ProjectTechnology');
const ProjectRole = require('../entities/ProjectRole');
const ProjectRoleSkill = require('../entities/ProjectRoleSkill');
const Application = require('../entities/Application');
const ProjectMember = require('../entities/ProjectMember');
const Task = require('../entities/Task');
const Rating = require('../entities/Rating');
const Notification = require('../entities/Notification');
const NotificationPreference = require('../entities/NotificationPreference');
const RefreshToken = require('../entities/RefreshToken');
const ProjectSubscription = require('../entities/ProjectSubscription');
const PaymentEvent = require('../entities/PaymentEvent');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  // IMPORTANT: synchronize is OFF. Schema changes go through migrations
  // (src/migrations) so nothing is silently dropped/altered on a shared or
  // production database. Run `npm run migration:run` after pulling schema
  // changes.
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  entities: [
    User,
    Skill,
    UserSkill,
    UserPortfolioLink,
    Category,
    Project,
    ProjectTechnology,
    ProjectRole,
    ProjectRoleSkill,
    Application,
    ProjectMember,
    Task,
    Rating,
    Notification,
    NotificationPreference,
    RefreshToken,
    ProjectSubscription,
    PaymentEvent,
  ],
  migrations: [__dirname + '/../migrations/*.js'],
  subscribers: [],
});

module.exports = AppDataSource;
