import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type Identidad } from '../auth/auth.guard';
import { Usuario } from '../auth/user.decorator';
import { CuerpoPipe } from '../common/pipes';
import { Rpc } from '../messaging/rpc';

@UseGuards(AuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly rpc: Rpc) {}

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(CuerpoPipe) cuerpo: Record<string, unknown>,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.socials.enviar('update_comment', {
      ...cuerpo,
      commentId: id,
      userId: usuario.userId,
    });
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.socials.enviar('delete_comment', {
      commentId: id,
      userId: usuario.userId,
    });
  }
}
