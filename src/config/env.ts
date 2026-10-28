import { z } from 'zod';

const esquema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  AMQP_URI: z.string().min(1).default('amqp://localhost:5672'),
  USERS_QUEUE: z.string().min(1).default('users_queue'),
  RECIPES_QUEUE: z.string().min(1).default('recipes_queue'),
  TAGS_QUEUE: z.string().min(1).default('tags_queue'),
  SOCIALS_QUEUE: z.string().min(1).default('socials_queue'),
  RPC_TIMEOUT_MS: z.coerce.number().int().min(500).max(60000).default(8000),
  CORS_ORIGINS: z.string().default('http://localhost:3001'),
  RATE_LIMIT: z.coerce.number().int().min(1).default(120),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof esquema>;

export const validarEntorno = (bruto: NodeJS.ProcessEnv): Env => {
  const resultado = esquema.safeParse(bruto);
  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Configuración inválida: ${detalle}`);
  }
  return resultado.data;
};

export const origenesPermitidos = (env: Pick<Env, 'CORS_ORIGINS'>) =>
  env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
