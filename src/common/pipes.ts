import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const ID_DE_MONGO = /^[0-9a-f]{24}$/i;

@Injectable()
export class MongoIdPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!ID_DE_MONGO.test(valor)) {
      throw new BadRequestException('ID inválido');
    }
    return valor;
  }
}

@Injectable()
export class CuerpoPipe
  implements PipeTransform<unknown, Record<string, unknown>>
{
  transform(valor: unknown): Record<string, unknown> {
    if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
      throw new BadRequestException(
        'El cuerpo de la solicitud debe ser un objeto JSON',
      );
    }
    return valor as Record<string, unknown>;
  }
}

@Injectable()
export class ListaDeIdsPipe
  implements PipeTransform<string | undefined, string[]>
{
  transform(valor: string | undefined): string[] {
    const ids = (valor ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.some((id) => !ID_DE_MONGO.test(id))) {
      throw new BadRequestException('La lista contiene un ID inválido');
    }
    return [...new Set(ids)];
  }
}
