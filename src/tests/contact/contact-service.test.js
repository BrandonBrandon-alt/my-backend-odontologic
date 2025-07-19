const contactService = require('../../services/contact-service');
const { ContactMessage } = require('../../models');
const mailer = require('../../utils/mailer');

jest.mock('../../models', () => ({
  ContactMessage: { create: jest.fn() }
}));
jest.mock('../../utils/mailer', () => ({
  sendConfirmationEmail: jest.fn(),
  sendNotificationEmail: jest.fn()
}));

describe('contactService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería enviar mensaje exitosamente', async () => {
    const data = {
      name: 'Juan Pérez',
      email: 'juan@test.com',
      phone: '+57 300 123-4567',
      subject: 'consulta',
      message: 'Hola, me gustaría consultar sobre los servicios dentales disponibles.'
    };
    const meta = { ip: '127.0.0.1', userAgent: 'jest' };
    const mockContactMessage = {
      id: 1,
      createdAt: new Date(),
      status: 'pending',
      ...data
    };
    require('../../models').ContactMessage.create.mockResolvedValue(mockContactMessage);
    mailer.sendConfirmationEmail.mockResolvedValue();
    mailer.sendNotificationEmail.mockResolvedValue();
    const result = await contactService.sendContactMessage(data, meta);
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id', 1);
    expect(mailer.sendConfirmationEmail).toHaveBeenCalledWith(data.email, data.name);
    expect(mailer.sendNotificationEmail).toHaveBeenCalledWith(mockContactMessage);
  });

  it('debería manejar errores internos', async () => {
    const data = {
      name: 'Juan Pérez',
      email: 'juan@test.com',
      phone: '+57 300 123-4567',
      subject: 'consulta',
      message: 'Hola, me gustaría consultar sobre los servicios dentales disponibles.'
    };
    const meta = { ip: '127.0.0.1', userAgent: 'jest' };
    require('../../models').ContactMessage.create.mockRejectedValue(new Error('DB error'));
    await expect(contactService.sendContactMessage(data, meta)).rejects.toThrow('DB error');
  });
}); 