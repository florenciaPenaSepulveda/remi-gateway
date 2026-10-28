import { origenesPermitidos, validarEntorno } from './env';

describe('validarEntorno', () => {
  it('aplica valores por defecto', () => {
    const env = validarEntorno({});
    expect(env.PORT).toBe(3000);
    expect(env.AMQP_URI).toBe('amqp://localhost:5672');
    expect(env.USERS_QUEUE).toBe('users_queue');
    expect(env.RECIPES_QUEUE).toBe('recipes_queue');
    expect(env.TAGS_QUEUE).toBe('tags_queue');
    expect(env.SOCIALS_QUEUE).toBe('socials_queue');
    expect(env.RPC_TIMEOUT_MS).toBe(8000);
    expect(env.TRUST_PROXY).toBe(false);
  });

  it('convierte los números y el booleano', () => {
    const env = validarEntorno({
      PORT: '8080',
      RATE_LIMIT: '50',
      TRUST_PROXY: 'true',
    });
    expect(env.PORT).toBe(8080);
    expect(env.RATE_LIMIT).toBe(50);
    expect(env.TRUST_PROXY).toBe(true);
  });

  it('rechaza valores fuera de rango', () => {
    expect(() => validarEntorno({ PORT: '0' })).toThrow(/PORT/);
    expect(() => validarEntorno({ RPC_TIMEOUT_MS: '10' })).toThrow(
      /RPC_TIMEOUT_MS/,
    );
    expect(() => validarEntorno({ TRUST_PROXY: 'quizás' })).toThrow(
      /TRUST_PROXY/,
    );
  });

  it('separa los orígenes permitidos', () => {
    expect(
      origenesPermitidos({ CORS_ORIGINS: ' http://a.cl , http://b.cl,, ' }),
    ).toEqual(['http://a.cl', 'http://b.cl']);
  });
});
