import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RpcExceptionInterceptor } from './filters/rpc-exception.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new RpcExceptionInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
