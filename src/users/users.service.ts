import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login-dto';

@Injectable()
export class UsersService {
  constructor(@Inject('USERS_SERVICE') private readonly client: ClientProxy) {}

  async login(loginDto: LoginDto) {
    return await firstValueFrom(
      this.client.send({ cmd: 'login_user' }, loginDto),
    );
  }

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
      this.client.send({ cmd: 'find_user_by_id' }, id), // <--- CORRECCIÓN: Envía el ID
    );
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
