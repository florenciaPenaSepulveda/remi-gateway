import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';
import { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app);
  app.enableShutdownHooks();
  const puerto = app
    .get<ConfigService<Env, true>>(ConfigService)
    .get('PORT', { infer: true });
  await app.listen(puerto);
  new Logger('Gateway').log(`Escuchando en el puerto ${puerto}`);
}
void bootstrap();
