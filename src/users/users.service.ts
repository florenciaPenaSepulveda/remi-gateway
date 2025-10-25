import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(@Inject('USERS_SERVICE') private readonly client: ClientProxy) {}

  async create(createUserDto: CreateUserDto) {
    return await firstValueFrom(
      this.client.send({ cmd: 'create_user' }, createUserDto),
    );
  }

  async findAll() {
    return await firstValueFrom(this.client.send({ cmd: 'get_all_users' }, {}));
  }

  async findOne(id: string) {
    return await firstValueFrom(
      this.client.send({ cmd: 'find_user_by_id' }, {}),
    );
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
