import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh-token')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    console.log('🔄 Refrescando token recibido:', refreshToken);
    return this.authService.refreshToken(refreshToken);
  }
}
