import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RECIPES_SERVICE',
        transport: Transport.RMQ,
        options: {
          // AQUÍ ESTABA EL PROBLEMA:
          // En lugar de process.env.AMQP_URI, ponemos la dirección directa para asegurar que conecte.
          urls: ['amqp://localhost:5672'],
          queue: 'recipes_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}