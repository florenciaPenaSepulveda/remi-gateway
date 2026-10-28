import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ErroresFilter } from './common/errores.filter';
import { Env, origenesPermitidos } from './config/env';

export const configurarApp = (app: NestExpressApplication) => {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: origenesPermitidos({
      CORS_ORIGINS: config.get('CORS_ORIGINS', { infer: true }),
    }),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  if (config.get('TRUST_PROXY', { infer: true })) {
    app.set('trust proxy', 1);
  }
  app.useGlobalFilters(new ErroresFilter());
  return app;
};
