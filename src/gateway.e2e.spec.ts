import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { TimeoutError } from 'rxjs';
import request from 'supertest';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';
import { Rpc } from './messaging/rpc';

const ANA = '607f1f77bcf86cd799439021';
const BETO = '607f1f77bcf86cd799439022';
const RECETA = '507f1f77bcf86cd799439011';
const UUID = '3f8a4a52-6d6c-4b1e-9f0e-5a3c8f2b7d11';
const TOKEN_ANA = 'token-de-ana';
const TOKEN_BETO = 'token-de-beto';

type Manejador = (cmd: string, datos: any) => unknown;

const crearDestino = () => {
  let manejador: Manejador = () => ({});
  const enviar = jest.fn(async (cmd: string, datos?: unknown) => {
    const resultado = manejador(cmd, datos);
    if (resultado instanceof Error || isRemoto(resultado)) {
      throw resultado;
    }
    return resultado;
  });
  return {
    enviar,
    responder: (m: Manejador) => {
      manejador = m;
    },
    llamadas: () => enviar.mock.calls.map(([cmd, datos]) => ({ cmd, datos })),
  };
};

const isRemoto = (valor: unknown): valor is { status: number } =>
  typeof valor === 'object' &&
  valor !== null &&
  'status' in valor &&
  'message' in valor &&
  (valor as { __error?: boolean }).__error === true;

const falla = (status: number, message: string | string[]) => ({
  status,
  message,
  __error: true,
});

describe('Gateway', () => {
  let app: NestExpressApplication;
  const rpc = {
    users: crearDestino(),
    recipes: crearDestino(),
    tags: crearDestino(),
    socials: crearDestino(),
  };

  const http = () => request(app.getHttpServer());
  const comoBeto = (r: request.Test) =>
    r.set('Authorization', `Bearer ${TOKEN_BETO}`);
  const comoAna = (r: request.Test) =>
    r.set('Authorization', `Bearer ${TOKEN_ANA}`);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Rpc)
      .useValue(rpc)
      .compile();
    app = configurarApp(modulo.createNestApplication<NestExpressApplication>());
    await app.init();
  });

  beforeEach(() => {
    Object.values(rpc).forEach((d) => d.enviar.mockClear());
    rpc.users.responder((cmd, datos) => {
      if (cmd === 'validate_token') {
        if (datos === TOKEN_ANA) return { userId: ANA, email: 'ana@remi.cl' };
        if (datos === TOKEN_BETO)
          return { userId: BETO, email: 'beto@remi.cl' };
        return falla(401, 'Token inválido o expirado');
      }
      if (cmd === 'find_user_by_id') {
        return { id: datos, name: 'Ana', email: 'ana@remi.cl' };
      }
      if (cmd === 'find_users_by_ids') {
        return [{ id: ANA, name: 'Ana', email: 'ana@remi.cl' }];
      }
      return {};
    });
    rpc.recipes.responder((cmd) =>
      cmd === 'find_recipe' ? { _id: RECETA, userId: ANA, title: 'Pasta' } : [],
    );
    rpc.tags.responder(() => []);
    rpc.socials.responder(() => ({}));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('plataforma', () => {
    it('responde el estado de salud', async () => {
      await http().get('/health').expect(200, { status: 'ok' });
    });

    it('aplica cabeceras de seguridad y no revela el framework', async () => {
      const respuesta = await http().get('/health');
      expect(respuesta.headers['x-powered-by']).toBeUndefined();
      expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
    });

    it('deja que el frontend lea las respuestas desde otro origen', async () => {
      const respuesta = await http().get('/health');
      expect(respuesta.headers['cross-origin-resource-policy']).toBe(
        'cross-origin',
      );
    });

    it('permite solo los orígenes configurados', async () => {
      const permitido = await http()
        .get('/health')
        .set('Origin', 'http://localhost:3001');
      expect(permitido.headers['access-control-allow-origin']).toBe(
        'http://localhost:3001',
      );
      const ajeno = await http().get('/health').set('Origin', 'http://malo.cl');
      expect(ajeno.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('responde 404 en rutas que no existen, sin exponer la lista de usuarios', async () => {
      await http().get('/users').expect(404);
      await http().get('/nada').expect(404);
    });
  });

  describe('autenticación', () => {
    it('exige token en las rutas protegidas', async () => {
      await http().get('/users/me').expect(401);
      await http().post('/recipes').send({}).expect(401);
      await http()
        .get('/users/me')
        .set('Authorization', `Basic ${TOKEN_ANA}`)
        .expect(401);
    });

    it('rechaza un token inválido', async () => {
      const respuesta = await http()
        .get('/users/me')
        .set('Authorization', 'Bearer cualquiera');
      expect(respuesta.status).toBe(401);
      expect(respuesta.body.message).toBe('Token inválido o expirado');
    });

    it('con token válido entrega el perfil propio', async () => {
      const respuesta = await comoAna(http().get('/users/me'));
      expect(respuesta.status).toBe(200);
      expect(rpc.users.llamadas()).toContainEqual({
        cmd: 'find_user_by_id',
        datos: ANA,
      });
    });

    it('propaga la caída del servicio de usuarios como 502, no como 401', async () => {
      rpc.users.responder(() => new Error('sin conexión'));
      await comoAna(http().get('/users/me')).expect(502);
    });

    it('traduce un tiempo agotado a 504', async () => {
      rpc.users.responder(() => new TimeoutError());
      const respuesta = await comoAna(http().get('/users/me'));
      expect(respuesta.status).toBe(504);
      expect(respuesta.body.message).toBe('El servicio no respondió a tiempo');
    });
  });

  describe('usuarios y sesión', () => {
    it('registra y entrega el resultado del servicio', async () => {
      rpc.users.responder(() => ({
        id: ANA,
        name: 'Ana',
        email: 'ana@remi.cl',
      }));
      const cuerpo = {
        name: 'Ana',
        email: 'ana@remi.cl',
        password: 'Clave123',
      };
      await http().post('/users').send(cuerpo).expect(201);
      expect(rpc.users.llamadas()).toEqual([
        { cmd: 'create_user', datos: cuerpo },
      ]);
    });

    it('traduce errores del servicio a respuestas HTTP con formato uniforme', async () => {
      rpc.users.responder(() =>
        falla(409, 'El usuario con este correo ya existe'),
      );
      const respuesta = await http().post('/users').send({ name: 'x' });
      expect(respuesta.status).toBe(409);
      expect(respuesta.body).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'El usuario con este correo ya existe',
      });
    });

    it('entrega la lista de motivos de validación', async () => {
      rpc.users.responder(() => falla(400, ['El correo no es válido', 'Otra']));
      const respuesta = await http().post('/users/login').send({});
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.message).toEqual([
        'El correo no es válido',
        'Otra',
      ]);
    });

    it('rechaza cuerpos que no son objetos', async () => {
      await http()
        .post('/users/login')
        .set('Content-Type', 'application/json')
        .send('[1,2]')
        .expect(400);
      expect(rpc.users.enviar).not.toHaveBeenCalled();
    });

    it('limita los intentos de inicio de sesión', async () => {
      const estados: number[] = [];
      for (let i = 0; i < 12; i++) {
        const r = await http()
          .post('/users/login')
          .send({ email: 'a@a.cl', password: 'x' });
        estados.push(r.status);
      }
      expect(estados.filter((s) => s === 201).length).toBeLessThanOrEqual(10);
      expect(estados.slice(-2)).toEqual([429, 429]);
    });

    it('renueva la sesión con el refresh token', async () => {
      rpc.users.responder(() => ({ accessToken: 'nuevo' }));
      await http()
        .post('/auth/refresh-token')
        .send({ refreshToken: 'abc' })
        .expect(201, { accessToken: 'nuevo' });
      await http().post('/auth/refresh-token').send({}).expect(400);
      await http()
        .post('/auth/refresh-token')
        .send({ refreshToken: 5 })
        .expect(400);
    });
  });

  describe('recetas', () => {
    it('al crear toma la autoría del token y no del cuerpo', async () => {
      await comoAna(http().post('/recipes'))
        .send({ title: 'Pasta', userId: BETO })
        .expect(201);
      expect(rpc.recipes.llamadas()).toEqual([
        { cmd: 'create_recipe', datos: { title: 'Pasta', userId: ANA } },
      ]);
    });

    it('lista las recetas sin exigir sesión', async () => {
      await http().get('/recipes').expect(200, []);
    });

    it('/recipes/mine usa la identidad del token', async () => {
      await comoAna(http().get('/recipes/mine')).expect(200);
      expect(rpc.recipes.llamadas()).toEqual([
        { cmd: 'find_recipes_by_user', datos: { userId: ANA } },
      ]);
    });

    it('las rutas de búsqueda no se confunden con un ID', async () => {
      await http().get('/recipes/search/calories?max=300').expect(200);
      await http()
        .get('/recipes/search/calories-range?min=100&max=300')
        .expect(200);
      await http()
        .get('/recipes/search/by-ingredients?ingredients=Pasta,Tomate&mode=any')
        .expect(200);
      await http()
        .get('/recipes/search/by-categories?categories=Postre')
        .expect(200);
      expect(rpc.recipes.llamadas().map((l) => l.cmd)).toEqual([
        'search_recipes_by_max_calories',
        'search_recipes_by_calories_range',
        'search_recipes_by_ingredients',
        'search_recipes_by_categories',
      ]);
      expect(rpc.recipes.llamadas()[0].datos).toEqual({ max: 300 });
    });

    it('valida los números de la búsqueda', async () => {
      const respuesta = await http().get('/recipes/search/calories?max=abc');
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.message).toBe('"max" debe ser un número');
      await http().get('/recipes/search/calories').expect(400);
      expect(rpc.recipes.enviar).not.toHaveBeenCalled();
    });

    it('rechaza IDs mal formados antes de llamar al servicio', async () => {
      await http().get('/recipes/123').expect(400);
      await comoAna(http().patch('/recipes/abc')).send({}).expect(400);
      expect(rpc.recipes.enviar).not.toHaveBeenCalled();
    });

    it('consulta una receta por ID', async () => {
      const respuesta = await http().get(`/recipes/${RECETA}`);
      expect(respuesta.body.title).toBe('Pasta');
    });

    it('al actualizar envía la identidad y los cambios', async () => {
      await comoAna(http().patch(`/recipes/${RECETA}`))
        .send({ title: 'Nueva' })
        .expect(200);
      expect(rpc.recipes.llamadas()).toEqual([
        {
          cmd: 'update_recipe',
          datos: { id: RECETA, userId: ANA, dto: { title: 'Nueva' } },
        },
      ]);
      await http().patch(`/recipes/${RECETA}`).send({}).expect(401);
    });

    it('un error de permisos del servicio llega como 403', async () => {
      rpc.recipes.responder(() =>
        falla(403, 'Solo la persona que creó la receta puede modificarla'),
      );
      await comoAna(http().delete(`/recipes/${RECETA}`)).expect(403);
      expect(rpc.socials.enviar).not.toHaveBeenCalled();
    });

    it('al eliminar limpia comentarios, reacciones y etiquetas', async () => {
      rpc.recipes.responder(() => ({ id: RECETA, deleted: true }));
      await comoAna(http().delete(`/recipes/${RECETA}`)).expect(200, {
        id: RECETA,
        deleted: true,
      });
      expect(rpc.socials.llamadas()).toEqual([
        {
          cmd: 'purge_recipe_social',
          datos: { recipeId: RECETA, authorId: ANA },
        },
      ]);
      expect(rpc.tags.llamadas()).toEqual([
        { cmd: 'remove_all_tags_from_recipe', datos: RECETA },
      ]);
    });

    it('la receta se elimina aunque falle la limpieza', async () => {
      rpc.recipes.responder(() => ({ id: RECETA, deleted: true }));
      rpc.socials.responder(() => new Error('caído'));
      await comoAna(http().delete(`/recipes/${RECETA}`)).expect(200);
    });
  });

  describe('etiquetas', () => {
    it('lista, busca y consulta sin sesión', async () => {
      await http().get('/tags').expect(200);
      await http().get('/tags/search?name=veg').expect(200);
      await http().get('/tags/search').expect(400);
      await http().get(`/tags/${UUID}`).expect(200);
      await http().get('/tags/no-es-uuid').expect(400);
    });

    it('crear etiquetas exige sesión', async () => {
      await http().post('/tags').send({ name: 'Postre' }).expect(401);
      await comoAna(http().post('/tags')).send({ name: 'Postre' }).expect(201);
      expect(rpc.tags.llamadas()).toEqual([
        { cmd: 'create_tag', datos: { name: 'Postre' } },
      ]);
    });

    it('trae las etiquetas de varias recetas', async () => {
      await http().get(`/tags/by-recipes?ids=${RECETA}`).expect(200);
      expect(rpc.tags.llamadas()).toEqual([
        { cmd: 'get_tags_of_recipes', datos: { recipeIds: [RECETA] } },
      ]);
      await http().get('/tags/by-recipes?ids=x').expect(400);
    });

    it('las recetas de una etiqueta se arman con los IDs del servicio de etiquetas', async () => {
      rpc.tags.responder(() => [RECETA]);
      await http().get(`/tags/${UUID}/recipes`).expect(200);
      expect(rpc.recipes.llamadas()).toEqual([
        { cmd: 'find_recipes_by_ids', datos: { ids: [RECETA] } },
      ]);
    });

    it('solo la autora cambia las etiquetas de su receta', async () => {
      const ajena = await http()
        .put(`/recipes/${RECETA}/tags`)
        .set('Authorization', `Bearer ${TOKEN_BETO}`)
        .send({ tagIds: [UUID] });
      expect(ajena.status).toBe(403);
      expect(rpc.tags.enviar).not.toHaveBeenCalled();

      const propia = await comoAna(http().put(`/recipes/${RECETA}/tags`)).send({
        tagIds: [UUID],
      });
      expect(propia.status).toBe(200);
      expect(rpc.tags.llamadas()).toEqual([
        { cmd: 'set_recipe_tags', datos: { recipeId: RECETA, tagIds: [UUID] } },
        { cmd: 'get_recipe_tags', datos: RECETA },
      ]);
    });

    it('exige una lista de etiquetas', async () => {
      await comoAna(http().put(`/recipes/${RECETA}/tags`))
        .send({ tagIds: 'x' })
        .expect(400);
    });

    it('consulta las etiquetas de una receta', async () => {
      await http().get(`/recipes/${RECETA}/tags`).expect(200);
      expect(rpc.tags.llamadas()[0]).toEqual({
        cmd: 'get_recipe_tags',
        datos: RECETA,
      });
    });
  });

  describe('puntuaciones y estadísticas', () => {
    it('puntúa una receta ajena tras comprobar que existe', async () => {
      await comoBeto(http().put(`/recipes/${RECETA}/rating`))
        .send({ stars: 4 })
        .expect(200);
      expect(rpc.recipes.llamadas()[0].cmd).toBe('find_recipe');
      expect(rpc.socials.llamadas()).toEqual([
        {
          cmd: 'rate_recipe',
          datos: { recipeId: RECETA, userId: BETO, authorId: ANA, stars: 4 },
        },
      ]);
    });

    it('no deja puntuar la propia receta', async () => {
      await comoAna(http().put(`/recipes/${RECETA}/rating`))
        .send({ stars: 5 })
        .expect(403);
      expect(rpc.socials.enviar).not.toHaveBeenCalled();
    });

    it('exige sesión y deja que el servicio valide la puntuación', async () => {
      await http()
        .put(`/recipes/${RECETA}/rating`)
        .send({ stars: 5 })
        .expect(401);
      rpc.socials.responder(() => falla(400, ['La puntuación máxima es 5']));
      const respuesta = await comoBeto(
        http().put(`/recipes/${RECETA}/rating`),
      ).send({
        stars: 9,
      });
      expect(respuesta.status).toBe(400);
    });

    it('una receta inexistente responde 404 sin puntuar', async () => {
      rpc.recipes.responder(() => falla(404, 'Receta no encontrada'));
      await comoBeto(http().put(`/recipes/${RECETA}/rating`))
        .send({ stars: 3 })
        .expect(404);
      expect(rpc.socials.enviar).not.toHaveBeenCalled();
    });

    it('quita la puntuación', async () => {
      await comoBeto(http().delete(`/recipes/${RECETA}/rating`)).expect(200);
      expect(rpc.socials.llamadas()).toEqual([
        {
          cmd: 'unrate_recipe',
          datos: { recipeId: RECETA, userId: BETO, authorId: ANA },
        },
      ]);
    });

    it('las estadísticas aceptan visitantes y personalizan con sesión', async () => {
      rpc.socials.responder((_cmd, datos) => ({
        [RECETA]: { average: 4.5, count: 2, myRating: datos.userId ? 5 : null },
      }));
      const visitante = await http().get(`/recipes/${RECETA}/stats`);
      expect(visitante.body.myRating).toBeNull();
      const conSesion = await comoAna(http().get(`/recipes/${RECETA}/stats`));
      expect(conSesion.body.myRating).toBe(5);
      await http()
        .get(`/recipes/${RECETA}/stats`)
        .set('Authorization', 'Bearer falso')
        .expect(401);
    });

    it('las estadísticas de varias recetas llegan en una consulta', async () => {
      await comoAna(
        http().get(`/recipes/stats?ids=${RECETA},${RECETA}`),
      ).expect(200);
      expect(rpc.socials.llamadas()).toEqual([
        {
          cmd: 'get_recipes_stats',
          datos: { recipeIds: [RECETA], userId: ANA },
        },
      ]);
    });

    it('ya no existen las rutas de me gusta y no me gusta', async () => {
      await comoAna(http().put(`/recipes/${RECETA}/reaction`))
        .send({ type: 'like' })
        .expect(404);
    });
  });

  describe('despensa', () => {
    it('busca recetas con lo que hay y agrega el autor', async () => {
      rpc.recipes.responder(() => [
        { _id: RECETA, userId: ANA, title: 'Pasta', match: { missing: [] } },
      ]);
      const respuesta = await http().get(
        '/recipes/search/by-pantry?ingredients=Pasta, Tomate,&maxMissing=2',
      );
      expect(respuesta.status).toBe(200);
      expect(respuesta.body[0].author).toEqual({ id: ANA, name: 'Ana' });
      expect(rpc.recipes.llamadas()).toEqual([
        {
          cmd: 'search_recipes_by_pantry',
          datos: { ingredients: ['Pasta', 'Tomate'], maxMissing: 2 },
        },
      ]);
    });

    it('la ruta no se confunde con un identificador', async () => {
      await http()
        .get('/recipes/search/by-pantry?ingredients=Pasta')
        .expect(200);
      expect(rpc.recipes.llamadas()[0].cmd).toBe('search_recipes_by_pantry');
    });

    it('valida el máximo de faltantes numérico', async () => {
      await http()
        .get('/recipes/search/by-pantry?ingredients=Pasta&maxMissing=muchos')
        .expect(400);
    });

    it('sin ingredientes el servicio responde con el error de validación', async () => {
      rpc.recipes.responder(() =>
        falla(400, ['Indica al menos un ingrediente']),
      );
      await http().get('/recipes/search/by-pantry').expect(400);
    });
  });

  describe('cociné esto', () => {
    it('calcula los gramos aprovechados sin contar básicos ni unidades sueltas', async () => {
      rpc.recipes.responder(() => ({
        _id: RECETA,
        userId: ANA,
        ingredients: [
          { quantity: 200, unit: 'gramos', ingredientId: { staple: false } },
          { quantity: 300, unit: 'ml', ingredientId: { staple: false } },
          { quantity: 5, unit: 'gramos', ingredientId: { staple: true } },
          { quantity: 2, unit: 'unidad', ingredientId: { staple: false } },
        ],
      }));
      await comoBeto(http().post(`/recipes/${RECETA}/cooked`))
        .send({ usedPantry: true, note: 'Rica' })
        .expect(201);
      expect(rpc.socials.llamadas()).toEqual([
        {
          cmd: 'mark_cooked',
          datos: {
            note: 'Rica',
            usedPantry: true,
            recipeId: RECETA,
            userId: BETO,
            authorId: ANA,
            grams: 500,
          },
        },
      ]);
    });

    it('por defecto no cuenta como despensa y exige sesión', async () => {
      await http().post(`/recipes/${RECETA}/cooked`).send({}).expect(401);
      await comoBeto(http().post(`/recipes/${RECETA}/cooked`))
        .send({})
        .expect(201);
      expect(rpc.socials.llamadas()[0].datos.usedPantry).toBe(false);
    });

    it('un registro repetido el mismo día llega como 409', async () => {
      rpc.socials.responder(() =>
        falla(409, 'Ya registraste esta receta como cocinada hoy'),
      );
      await comoBeto(http().post(`/recipes/${RECETA}/cooked`))
        .send({})
        .expect(409);
    });
  });

  describe('recetario', () => {
    const LISTA = '3f8a4a52-6d6c-4b1e-9f0e-5a3c8f2b7d11';

    it('exige sesión en todas las rutas', async () => {
      await http().get('/cookbook/lists').expect(401);
      await http().post('/cookbook/lists').send({ name: 'x' }).expect(401);
      await http().get(`/cookbook/lists/${LISTA}`).expect(401);
      await http().get('/cookbook/cooked').expect(401);
    });

    it('lista y crea listas con la identidad del token', async () => {
      await comoAna(http().get('/cookbook/lists')).expect(200);
      await comoAna(http().post('/cookbook/lists'))
        .send({ name: 'Cenas', userId: BETO })
        .expect(201);
      expect(rpc.socials.llamadas()).toEqual([
        { cmd: 'get_lists', datos: { userId: ANA } },
        { cmd: 'create_list', datos: { name: 'Cenas', userId: ANA } },
      ]);
    });

    it('renombra y elimina una lista', async () => {
      await comoAna(http().patch(`/cookbook/lists/${LISTA}`))
        .send({ name: 'Nuevo' })
        .expect(200);
      await comoAna(http().delete(`/cookbook/lists/${LISTA}`)).expect(200);
      expect(rpc.socials.llamadas().map((l) => l.cmd)).toEqual([
        'rename_list',
        'delete_list',
      ]);
      await comoAna(http().delete('/cookbook/lists/no-uuid')).expect(400);
    });

    it('abre una lista con sus recetas en el mismo orden y sin las eliminadas', async () => {
      const A = '507f1f77bcf86cd799439011';
      const B = '507f1f77bcf86cd799439012';
      const C = '507f1f77bcf86cd799439013';
      rpc.socials.responder(() => ({
        id: LISTA,
        name: 'Cenas',
        recipeIds: [B, C, A],
      }));
      rpc.recipes.responder(() => [
        { _id: A, userId: ANA, title: 'A' },
        { _id: B, userId: ANA, title: 'B' },
      ]);
      const respuesta = await comoAna(http().get(`/cookbook/lists/${LISTA}`));
      expect(respuesta.status).toBe(200);
      expect(
        respuesta.body.recipes.map((r: { title: string }) => r.title),
      ).toEqual(['B', 'A']);
      expect(respuesta.body.recipes[0].author.name).toBe('Ana');
    });

    it('una lista vacía no consulta recetas', async () => {
      rpc.socials.responder(() => ({
        id: LISTA,
        name: 'Vacía',
        recipeIds: [],
      }));
      const respuesta = await comoAna(http().get(`/cookbook/lists/${LISTA}`));
      expect(respuesta.body.recipes).toEqual([]);
      expect(rpc.recipes.enviar).not.toHaveBeenCalled();
    });

    it('agrega una receta que existe y la quita', async () => {
      await comoAna(
        http().put(`/cookbook/lists/${LISTA}/recipes/${RECETA}`),
      ).expect(200);
      expect(rpc.recipes.llamadas()[0].cmd).toBe('find_recipe');
      expect(rpc.socials.llamadas()[0]).toEqual({
        cmd: 'add_to_list',
        datos: { userId: ANA, listId: LISTA, recipeId: RECETA },
      });
      await comoAna(
        http().delete(`/cookbook/lists/${LISTA}/recipes/${RECETA}`),
      ).expect(200);
      await comoAna(http().put(`/cookbook/lists/${LISTA}/recipes/xyz`)).expect(
        400,
      );
    });

    it('no agrega una receta inexistente', async () => {
      rpc.recipes.responder(() => falla(404, 'Receta no encontrada'));
      await comoAna(
        http().put(`/cookbook/lists/${LISTA}/recipes/${RECETA}`),
      ).expect(404);
      expect(rpc.socials.enviar).not.toHaveBeenCalled();
    });

    it('el permiso de la lista lo decide el servicio', async () => {
      rpc.socials.responder(() =>
        falla(403, 'Solo la persona dueña de la lista puede modificarla'),
      );
      await comoBeto(http().get(`/cookbook/lists/${LISTA}`)).expect(403);
    });

    it('el historial incluye la receta de cada registro', async () => {
      rpc.socials.responder(() => ({
        items: [
          { id: 'c1', recipeId: RECETA },
          { id: 'c2', recipeId: '507f1f77bcf86cd799439099' },
        ],
        total: 2,
      }));
      rpc.recipes.responder(() => [
        { _id: RECETA, userId: ANA, title: 'Pasta' },
      ]);
      const respuesta = await comoAna(http().get('/cookbook/cooked?limit=10'));
      expect(respuesta.body.items[0].recipe.title).toBe('Pasta');
      expect(respuesta.body.items[1].recipe).toBeNull();
      expect(rpc.socials.llamadas()[0].datos).toEqual({
        userId: ANA,
        limit: 10,
        offset: undefined,
      });
    });
  });

  describe('impacto y perfiles de creadores', () => {
    it('el impacto es público y reúne los tres servicios', async () => {
      rpc.socials.responder(() => ({
        cooked: 40,
        pantryCooked: 25,
        grams: 18450,
      }));
      rpc.users.responder(() => 12);
      rpc.recipes.responder(() => 30);
      const respuesta = await http().get('/impact');
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toEqual({
        cooked: 40,
        pantryCooked: 25,
        kilos: 18.5,
        members: 12,
        recipes: 30,
      });
    });

    it('el perfil de un creador es público y calcula su nivel', async () => {
      rpc.users.responder((cmd) =>
        cmd === 'find_users_by_ids'
          ? [{ id: ANA, name: 'Ana' }]
          : { id: ANA, name: 'Ana', email: 'ana@remi.cl' },
      );
      rpc.recipes.responder(() => [
        { _id: RECETA, userId: ANA, title: 'Pasta' },
      ]);
      rpc.socials.responder(() => ({
        [ANA]: { average: 4.6, ratings: 8, cookedByOthers: 30 },
      }));
      const respuesta = await http().get(`/users/${ANA}/profile`);
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({
        id: ANA,
        name: 'Ana',
        level: 'chef',
        recipesCount: 1,
        average: 4.6,
        ratings: 8,
        cookedByOthers: 30,
      });
      expect(respuesta.body.recipes[0].author.name).toBe('Ana');
      expect(JSON.stringify(respuesta.body)).not.toContain('ana@remi.cl');
    });

    it.each([
      [0, 'aprendiz'],
      [4, 'aprendiz'],
      [5, 'cocinero'],
      [24, 'cocinero'],
      [25, 'chef'],
    ])(
      'con %i recetas cocinadas por otras personas es %s',
      async (n, nivel) => {
        rpc.users.responder(() => ({ id: ANA, name: 'Ana' }));
        rpc.recipes.responder(() => []);
        rpc.socials.responder(() => ({
          [ANA]: { average: 0, ratings: 0, cookedByOthers: n },
        }));
        const respuesta = await http().get(`/users/${ANA}/profile`);
        expect(respuesta.body.level).toBe(nivel);
      },
    );

    it('un ID inválido o inexistente se informa', async () => {
      await http().get('/users/xyz/profile').expect(400);
      rpc.users.responder(() => falla(404, 'Usuario no encontrado'));
      await http().get(`/users/${ANA}/profile`).expect(404);
    });

    it('/users/me incluye las estadísticas propias', async () => {
      rpc.users.responder((cmd) =>
        cmd === 'validate_token'
          ? { userId: ANA, email: 'ana@remi.cl' }
          : { id: ANA, name: 'Ana' },
      );
      rpc.socials.responder(() => ({ cooked: 3, grams: 900 }));
      const respuesta = await comoAna(http().get('/users/me'));
      expect(respuesta.body).toMatchObject({
        id: ANA,
        stats: { cooked: 3, grams: 900 },
      });
    });
  });

  describe('comentarios', () => {
    it('lista con el nombre de quien comenta', async () => {
      rpc.socials.responder(() => ({
        items: [
          { id: UUID, userId: ANA, text: 'Rica' },
          { id: UUID, userId: BETO, text: 'Buena' },
        ],
        total: 2,
        limit: 50,
        offset: 0,
      }));
      const respuesta = await http().get(
        `/recipes/${RECETA}/comments?limit=5&offset=1`,
      );
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.items[0].author).toEqual({ id: ANA, name: 'Ana' });
      expect(respuesta.body.items[1].author).toEqual({
        id: BETO,
        name: 'Usuario eliminado',
      });
      expect(rpc.socials.llamadas()[0].datos).toEqual({
        recipeId: RECETA,
        limit: 5,
        offset: 1,
      });
    });

    it('una página vacía no consulta usuarios', async () => {
      rpc.socials.responder(() => ({
        items: [],
        total: 0,
        limit: 50,
        offset: 0,
      }));
      await http().get(`/recipes/${RECETA}/comments`).expect(200);
      expect(rpc.users.enviar).not.toHaveBeenCalled();
    });

    it('valida el límite numérico', async () => {
      await http().get(`/recipes/${RECETA}/comments?limit=mucho`).expect(400);
    });

    it('comentar toma la identidad del token', async () => {
      rpc.socials.responder(() => ({ id: UUID, userId: ANA, text: 'Rica' }));
      const respuesta = await comoAna(
        http().post(`/recipes/${RECETA}/comments`),
      ).send({
        text: 'Rica',
        userId: BETO,
      });
      expect(respuesta.status).toBe(201);
      expect(respuesta.body.author.name).toBe('Ana');
      expect(rpc.socials.llamadas()[0].datos).toEqual({
        text: 'Rica',
        recipeId: RECETA,
        userId: ANA,
      });
      await http()
        .post(`/recipes/${RECETA}/comments`)
        .send({ text: 'x' })
        .expect(401);
    });

    it('editar y eliminar exigen sesión y envían la identidad', async () => {
      await http().patch(`/comments/${UUID}`).send({ text: 'x' }).expect(401);
      await http().delete(`/comments/${UUID}`).expect(401);
      await comoAna(http().patch(`/comments/${UUID}`))
        .send({ text: 'Editado' })
        .expect(200);
      await comoAna(http().delete(`/comments/${UUID}`)).expect(200);
      expect(rpc.socials.llamadas()).toEqual([
        {
          cmd: 'update_comment',
          datos: { text: 'Editado', commentId: UUID, userId: ANA },
        },
        { cmd: 'delete_comment', datos: { commentId: UUID, userId: ANA } },
      ]);
      await comoAna(http().delete('/comments/no-uuid')).expect(400);
    });
  });

  describe('ingredientes', () => {
    it('la consulta es pública y las modificaciones exigen sesión', async () => {
      await http().get('/ingredients').expect(200);
      await http().get(`/ingredients/${RECETA}`).expect(200);
      await http().post('/ingredients').send({ name: 'Sal' }).expect(401);
      await http().patch(`/ingredients/${RECETA}`).send({}).expect(401);
      await http().delete(`/ingredients/${RECETA}`).expect(401);
      await http().post('/ingredients/populate').send([]).expect(401);
    });

    it('con sesión crea, actualiza, elimina y carga en bloque', async () => {
      await comoAna(http().post('/ingredients'))
        .send({ name: 'Sal' })
        .expect(201);
      await comoAna(http().patch(`/ingredients/${RECETA}`))
        .send({ unit: 'g' })
        .expect(200);
      await comoAna(http().delete(`/ingredients/${RECETA}`)).expect(200);
      await comoAna(http().post('/ingredients/populate'))
        .send([{ name: 'Sal' }])
        .expect(201);
      expect(rpc.recipes.llamadas()).toEqual([
        { cmd: 'create_ingredient', datos: { name: 'Sal' } },
        { cmd: 'update_ingredient', datos: { id: RECETA, dto: { unit: 'g' } } },
        { cmd: 'remove_ingredient', datos: RECETA },
        { cmd: 'populate_ingredients', datos: { items: [{ name: 'Sal' }] } },
      ]);
    });

    it('la carga en bloque exige una lista', async () => {
      await comoAna(http().post('/ingredients/populate'))
        .send({ name: 'Sal' })
        .expect(400);
    });
  });
});
