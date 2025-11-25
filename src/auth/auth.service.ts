import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(@Inject('USERS_SERVICE') private client: ClientProxy) {}

  async validateToken(token: string) {
    return await firstValueFrom(
      this.client.send({ cmd: 'validate_token' }, token),
    );
  }

  async refreshToken(token: string) {
    return await firstValueFrom(
      this.client.send({ cmd: 'refresh_token' }, token),
    );
  }
}
