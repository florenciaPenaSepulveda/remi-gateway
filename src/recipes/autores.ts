import { Rpc } from '../messaging/rpc';

interface ConAutor {
  userId?: string;
}

export interface Persona {
  id: string;
  name: string;
}

export const conAutores = async <T extends ConAutor>(
  rpc: Rpc,
  recetas: T[],
): Promise<Array<T & { author: Persona }>> => {
  const ids = [
    ...new Set(recetas.map((r) => r.userId).filter((id): id is string => !!id)),
  ];
  const usuarios = ids.length
    ? await rpc.users.enviar<Persona[]>('find_users_by_ids', { ids })
    : [];
  const nombres = new Map(usuarios.map((u) => [u.id, u.name]));
  return recetas.map((receta) => ({
    ...receta,
    author: {
      id: String(receta.userId),
      name: nombres.get(String(receta.userId)) ?? 'Usuario eliminado',
    },
  }));
};

interface LineaDeReceta {
  quantity: number;
  unit?: string;
  ingredientId?: { staple?: boolean; unit?: string };
}

const UNIDADES_DE_MASA = new Set(['g', 'gr', 'gramo', 'gramos', 'ml']);

export const gramosAprovechables = (lineas: LineaDeReceta[] = []): number =>
  Math.round(
    lineas
      .filter((l) => !l.ingredientId?.staple)
      .filter((l) => UNIDADES_DE_MASA.has((l.unit ?? '').toLowerCase()))
      .reduce((total, l) => total + l.quantity, 0),
  );

export type NivelDeCreador = 'aprendiz' | 'cocinero' | 'chef';

export const nivelDeCreador = (cookedByOthers: number): NivelDeCreador => {
  if (cookedByOthers >= 25) {
    return 'chef';
  }
  return cookedByOthers >= 5 ? 'cocinero' : 'aprendiz';
};
