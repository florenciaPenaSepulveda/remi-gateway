import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import appconfig from '../config/app.config';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'RECIPES_SERVICE',
        imports: [ConfigModule],
        inject: [appconfig.KEY],
        useFactory: (config: ConfigType<typeof appconfig>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.amqp_uri],
            // 🔸 puedes usar la misma cola o una específica para libros:
            queue: config.recipe_queue,
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [RecipesController, IngredientsController],
  providers: [RecipesService, IngredientsService],
})
export class RecipesModule {}
