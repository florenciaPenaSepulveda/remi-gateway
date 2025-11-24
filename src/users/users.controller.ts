import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    console.log('Creando usuario desde el gateway');
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: any) {
    console.log('Iniciando sesión desde el gateway');
    return this.usersService.login(loginDto);
  }

  @Get()
  findAll() {
    console.log('Obteniendo todos los usuarios desde el gateway');
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log(`Obteniendo usuario con id ${id} desde el gateway`);
    return this.usersService.findOne(id);
  }
}
