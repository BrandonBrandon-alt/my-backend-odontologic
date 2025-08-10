// Jest global test setup
const models = require('../models');

// Mock mailer to avoid real email operations during tests
jest.mock('../utils/mailer', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true),
  sendAppointmentConfirmationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock reCAPTCHA verification to always pass in tests
jest.mock('../controllers/auth-controller', () => {
  const actual = jest.requireActual('../controllers/auth-controller');
  return {
    ...actual,
    verifyRecaptcha: jest.fn().mockResolvedValue({ success: true, score: 0.9 })
  };
});

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test' && models.sequelize) {
    await models.sequelize.sync({ force: true });
  }
});

afterAll(async () => {
  if (models.sequelize) {
    await models.sequelize.close();
  }
});