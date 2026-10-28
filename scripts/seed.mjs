const API = process.env.API_URL ?? 'http://localhost:3000';
const CLAVE = 'Remi12345';

const usuarios = [
  { name: 'Camila Rojas', email: 'camila@remi.cl' },
  { name: 'Matías Soto', email: 'matias@remi.cl' },
  { name: 'Valentina Pérez', email: 'valentina@remi.cl' },
  { name: 'Diego Fuentes', email: 'diego@remi.cl' },
];

const ingredientes = [
  ['Harina', 'gramos', 3.6],
  ['Azúcar', 'gramos', 4],
  ['Mantequilla', 'gramos', 7.2],
  ['Huevo', 'unidad', 70],
  ['Leche', 'ml', 0.6],
  ['Sal', 'gramos', 0],
  ['Aceite de oliva', 'ml', 8.8],
  ['Tomate', 'gramos', 0.2],
  ['Cebolla', 'gramos', 0.4],
  ['Ajo', 'gramos', 1.5],
  ['Papa', 'gramos', 0.8],
  ['Zanahoria', 'gramos', 0.4],
  ['Palta', 'gramos', 1.6],
  ['Lechuga', 'gramos', 0.15],
  ['Pollo', 'gramos', 1.65],
  ['Carne molida', 'gramos', 2.5],
  ['Arroz', 'gramos', 3.6],
  ['Fideos', 'gramos', 3.5],
  ['Queso mozzarella', 'gramos', 3],
  ['Queso parmesano', 'gramos', 4],
  ['Albahaca', 'gramos', 0.2],
  ['Limón', 'gramos', 0.3],
  ['Choclo', 'gramos', 0.9],
  ['Chocolate', 'gramos', 5.4],
  ['Nueces', 'gramos', 6.5],
  ['Plátano', 'gramos', 0.9],
  ['Avena', 'gramos', 3.7],
  ['Miel', 'gramos', 3],
  ['Salmón', 'gramos', 2.1],
  ['Champiñones', 'gramos', 0.2],
  ['Crema', 'gramos', 3],
  ['Pan de molde', 'gramos', 2.6],
];

const etiquetas = [
  'Desayuno',
  'Almuerzo',
  'Cena',
  'Postre',
  'Vegetariano',
  'Rápido',
  'Saludable',
  'Chileno',
  'Italiano',
  'Horneado',
];

const basicos = new Set(['Sal', 'Aceite de oliva', 'Azúcar']);

const datosDePreparacion = {
  'Pasta al pomodoro': [25, 'facil'],
  'Pizza margarita casera': [90, 'media'],
  'Panqueques con miel': [20, 'facil'],
  'Ensalada de palta y tomate': [10, 'facil'],
  'Tostadas con palta y huevo': [10, 'facil'],
  'Arroz con pollo': [50, 'media'],
  'Pastel de papas': [75, 'media'],
  'Brownie de chocolate y nueces': [45, 'media'],
  'Salmón al horno con limón': [40, 'facil'],
  'Avena con plátano y nueces': [10, 'facil'],
  'Crema de zanahoria': [40, 'facil'],
  'Champiñones al ajo sobre pan': [15, 'facil'],
  'Choclo gratinado': [35, 'facil'],
  'Hamburguesa casera': [25, 'facil'],
};

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const foto = (id) =>
  `https://images.unsplash.com/photo-${id}?w=1000&q=80&auto=format&fit=crop`;

const recetas = [
  {
    autor: 0,
    title: 'Pasta al pomodoro',
    categories: ['Almuerzo', 'Italiano', 'Vegetariano', 'Rápido'],
    servings: 2,
    image: '1551183053-bf91a1d81141',
    instructions: [
      'Hierve los fideos en agua con sal hasta que estén al dente.',
      'Sofríe el ajo picado en el aceite de oliva sin que se queme.',
      'Agrega el tomate picado y cocina 12 minutos hasta que se espese.',
      'Mezcla los fideos con la salsa, suma la albahaca y sirve con parmesano rallado.',
    ],
    ingredients: [['Fideos', 200], ['Tomate', 400], ['Ajo', 10], ['Aceite de oliva', 15], ['Albahaca', 5], ['Queso parmesano', 30], ['Sal', 3]],
  },
  {
    autor: 1,
    title: 'Pizza margarita casera',
    categories: ['Cena', 'Italiano', 'Horneado', 'Vegetariano'],
    servings: 4,
    image: '1565299624946-b28f40a0ae38',
    instructions: [
      'Mezcla la harina con sal, agua tibia y aceite; amasa 10 minutos y deja reposar una hora.',
      'Estira la masa sobre una bandeja y cúbrela con tomate triturado.',
      'Reparte el queso mozzarella y hornea a máxima temperatura 12 minutos.',
      'Termina con hojas de albahaca fresca.',
    ],
    ingredients: [['Harina', 300], ['Tomate', 250], ['Queso mozzarella', 200], ['Aceite de oliva', 20], ['Albahaca', 5], ['Sal', 5]],
  },
  {
    autor: 2,
    title: 'Panqueques con miel',
    categories: ['Desayuno', 'Postre', 'Rápido'],
    servings: 4,
    image: '1567620905732-2d1ec7ab7445',
    instructions: [
      'Bate los huevos con la leche y el azúcar.',
      'Incorpora la harina de a poco hasta obtener una mezcla sin grumos.',
      'Cocina porciones en una sartén con mantequilla, dos minutos por lado.',
      'Sirve tibios con miel.',
    ],
    ingredients: [['Harina', 150], ['Huevo', 2], ['Leche', 300], ['Mantequilla', 20], ['Miel', 40], ['Azúcar', 15]],
  },
  {
    autor: 3,
    title: 'Ensalada de palta y tomate',
    categories: ['Almuerzo', 'Saludable', 'Vegetariano', 'Rápido'],
    servings: 2,
    image: '1540189549336-e6e99c3679fe',
    instructions: [
      'Corta la palta, el tomate y la cebolla en cubos o plumas.',
      'Lava y trocea la lechuga y arma la base del plato.',
      'Aliña con jugo de limón, aceite de oliva y sal.',
    ],
    ingredients: [['Palta', 200], ['Tomate', 200], ['Cebolla', 50], ['Limón', 30], ['Aceite de oliva', 15], ['Sal', 2], ['Lechuga', 100]],
  },
  {
    autor: 0,
    title: 'Tostadas con palta y huevo',
    categories: ['Desayuno', 'Saludable', 'Rápido'],
    servings: 1,
    image: '1482049016688-2d3e1b311543',
    instructions: [
      'Tuesta el pan hasta que esté dorado.',
      'Machaca la palta con limón y sal y úntala sobre el pan.',
      'Fríe o poché los huevos y colócalos encima.',
    ],
    ingredients: [['Pan de molde', 80], ['Palta', 120], ['Huevo', 2], ['Limón', 10], ['Sal', 2]],
  },
  {
    autor: 1,
    title: 'Arroz con pollo',
    categories: ['Almuerzo', 'Chileno'],
    servings: 4,
    image: '1565557623262-b51c2513a641',
    instructions: [
      'Sella el pollo troceado en aceite caliente y retíralo.',
      'En la misma olla sofríe cebolla, ajo y zanahoria en cubitos.',
      'Agrega el arroz, mezcla un minuto y cubre con el doble de agua caliente.',
      'Devuelve el pollo, tapa y cocina a fuego bajo 20 minutos.',
    ],
    ingredients: [['Arroz', 300], ['Pollo', 500], ['Zanahoria', 100], ['Cebolla', 100], ['Ajo', 10], ['Aceite de oliva', 20], ['Sal', 5]],
  },
  {
    autor: 2,
    title: 'Pastel de papas',
    categories: ['Almuerzo', 'Chileno', 'Horneado'],
    servings: 6,
    image: '1504674900247-0877df9cc836',
    instructions: [
      'Cuece las papas y prepara un puré con mantequilla y leche.',
      'Sofríe la cebolla y la carne molida hasta que se doren; sazona con sal.',
      'En una fuente, pon la carne, rodajas de huevo duro y cubre con el puré.',
      'Hornea 25 minutos hasta que la superficie esté dorada.',
    ],
    ingredients: [['Papa', 800], ['Carne molida', 400], ['Cebolla', 150], ['Huevo', 2], ['Mantequilla', 40], ['Leche', 100], ['Aceite de oliva', 15], ['Sal', 5]],
  },
  {
    autor: 3,
    title: 'Brownie de chocolate y nueces',
    categories: ['Postre', 'Horneado'],
    servings: 9,
    image: '1606313564200-e75d5e30476c',
    instructions: [
      'Derrite el chocolate con la mantequilla a baño María.',
      'Mezcla con el azúcar y los huevos, uno a uno.',
      'Incorpora la harina y las nueces picadas.',
      'Hornea a 180 grados por 25 minutos; debe quedar húmedo por dentro.',
    ],
    ingredients: [['Chocolate', 200], ['Mantequilla', 150], ['Azúcar', 150], ['Huevo', 3], ['Harina', 100], ['Nueces', 80]],
  },
  {
    autor: 0,
    title: 'Salmón al horno con limón',
    categories: ['Cena', 'Saludable', 'Horneado'],
    servings: 2,
    image: '1467003909585-2f8a72700288',
    instructions: [
      'Parte las papas en rodajas y hornéalas con aceite y sal 15 minutos.',
      'Pon el salmón encima con ajo laminado y rodajas de limón.',
      'Hornea 15 minutos más a 200 grados.',
    ],
    ingredients: [['Salmón', 400], ['Limón', 40], ['Aceite de oliva', 15], ['Ajo', 8], ['Sal', 3], ['Papa', 400]],
  },
  {
    autor: 1,
    title: 'Avena con plátano y nueces',
    categories: ['Desayuno', 'Saludable', 'Vegetariano', 'Rápido'],
    servings: 1,
    image: '1517673400267-0251440c45dc',
    instructions: [
      'Calienta la leche y cocina la avena cinco minutos revolviendo.',
      'Sirve con plátano en rodajas, nueces picadas y un hilo de miel.',
    ],
    ingredients: [['Avena', 80], ['Leche', 250], ['Plátano', 120], ['Nueces', 20], ['Miel', 15]],
  },
  {
    autor: 2,
    title: 'Crema de zanahoria',
    categories: ['Cena', 'Vegetariano', 'Saludable'],
    servings: 4,
    image: '1476718406336-bb5a9690ee2a',
    instructions: [
      'Sofríe la cebolla en mantequilla.',
      'Agrega la zanahoria y la papa en trozos y cubre con agua; cuece 25 minutos.',
      'Procesa hasta que quede suave, incorpora la crema y sazona.',
    ],
    ingredients: [['Zanahoria', 500], ['Cebolla', 100], ['Papa', 200], ['Crema', 60], ['Mantequilla', 20], ['Sal', 4]],
  },
  {
    autor: 3,
    title: 'Champiñones al ajo sobre pan',
    categories: ['Cena', 'Vegetariano', 'Rápido'],
    servings: 2,
    image: '1555939594-58d7cb561ad1',
    instructions: [
      'Lamina los champiñones y saltéalos a fuego fuerte en mantequilla.',
      'Agrega el ajo picado y sal; cocina un minuto más.',
      'Sirve sobre pan tostado.',
    ],
    ingredients: [['Champiñones', 400], ['Ajo', 15], ['Mantequilla', 30], ['Pan de molde', 60], ['Sal', 2]],
  },
  {
    autor: 0,
    title: 'Choclo gratinado',
    categories: ['Almuerzo', 'Chileno', 'Horneado'],
    servings: 4,
    image: '1432139555190-58524dae6a55',
    instructions: [
      'Desgrana el choclo y mézclalo con la crema y la mantequilla derretida.',
      'Pásalo a una fuente, cubre con mozzarella y sazona.',
      'Gratina en el horno hasta que burbujee y se dore.',
    ],
    ingredients: [['Choclo', 500], ['Queso mozzarella', 150], ['Crema', 80], ['Mantequilla', 20], ['Sal', 3]],
  },
  {
    autor: 1,
    title: 'Hamburguesa casera',
    categories: ['Cena', 'Almuerzo'],
    servings: 2,
    image: '1568901346375-23c9450c58cd',
    instructions: [
      'Forma dos tortitas con la carne molida y sal.',
      'Cocínalas en sartén bien caliente tres minutos por lado.',
      'Arma con pan, lechuga, tomate, cebolla y queso fundido.',
    ],
    ingredients: [['Carne molida', 300], ['Pan de molde', 80], ['Cebolla', 60], ['Tomate', 80], ['Lechuga', 30], ['Queso mozzarella', 40]],
  },
];

const comentarios = [
  'Quedó riquísima, la hice para el almuerzo del domingo.',
  'Súper fácil de seguir. La repetiré esta semana.',
  'Le agregué un poco más de sal y quedó perfecta.',
  'A mis hijos les encantó, gracias por compartirla.',
  'Muy buena receta, los tiempos son exactos.',
  'La mejor que he probado en mucho tiempo.',
];

const pedir = async (metodo, ruta, { cuerpo, token } = {}) => {
  for (let intento = 0; intento < 6; intento++) {
    const respuesta = await fetch(API + ruta, {
      method: metodo,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    if (respuesta.status === 429) {
      await esperar(8000);
      continue;
    }
    await esperar(450);
    const datos = await respuesta.json().catch(() => null);
    return { estado: respuesta.status, datos };
  }
  throw new Error(`Demasiadas peticiones en ${ruta}`);
};

const exigir = (resultado, descripcion) => {
  if (resultado.estado >= 400) {
    throw new Error(`${descripcion}: ${resultado.estado} ${JSON.stringify(resultado.datos)}`);
  }
  return resultado.datos;
};

const main = async () => {
  const sesiones = [];
  for (const u of usuarios) {
    const registro = await pedir('POST', '/users', { cuerpo: { ...u, password: CLAVE } });
    if (registro.estado !== 201 && registro.estado !== 409) exigir(registro, `registro de ${u.email}`);
    const login = exigir(await pedir('POST', '/users/login', { cuerpo: { email: u.email, password: CLAVE } }), `login de ${u.email}`);
    sesiones.push({ token: login.accessToken, id: login.user.id });
  }
  const autor = sesiones[0].token;
  console.log(`Usuarios listos: ${usuarios.length} (clave ${CLAVE})`);

  exigir(
    await pedir('POST', '/ingredients/populate', {
      token: autor,
      cuerpo: ingredientes.map(([name, unit, caloriesPerUnit]) => ({
        name,
        unit,
        caloriesPerUnit,
        staple: basicos.has(name),
      })),
    }),
    'carga de ingredientes',
  );
  console.log(`Ingredientes en el catálogo: ${ingredientes.length}`);

  for (const name of etiquetas) {
    const r = await pedir('POST', '/tags', { token: autor, cuerpo: { name } });
    if (r.estado !== 201 && r.estado !== 409) exigir(r, `etiqueta ${name}`);
  }
  const idsDeEtiquetas = new Map(
    exigir(await pedir('GET', '/tags'), 'lista de etiquetas').map((t) => [t.name, t.id]),
  );

  const existentes = new Set(
    exigir(await pedir('GET', '/recipes'), 'lista de recetas').map((r) => r.title),
  );
  const creadas = [];
  for (const r of recetas) {
    if (existentes.has(r.title)) continue;
    const { token } = sesiones[r.autor];
    const receta = exigir(
      await pedir('POST', '/recipes', {
        token,
        cuerpo: {
          title: r.title,
          categories: r.categories,
          servings: r.servings,
          instructions: r.instructions,
          imageUrl: foto(r.image),
          prepMinutes: datosDePreparacion[r.title]?.[0],
          difficulty: datosDePreparacion[r.title]?.[1],
          ingredients: r.ingredients.map(([name, quantity]) => ({ name, quantity })),
        },
      }),
      `receta ${r.title}`,
    );
    const tagIds = r.categories.map((c) => idsDeEtiquetas.get(c)).filter(Boolean);
    exigir(await pedir('PUT', `/recipes/${receta._id}/tags`, { token, cuerpo: { tagIds } }), `etiquetas de ${r.title}`);
    creadas.push(receta);
  }
  console.log(`Recetas nuevas: ${creadas.length} de ${recetas.length}`);

  creadas.forEach((receta, i) => {
    receta.indice = i;
    receta.autor = recetas[i].autor;
  });

  const patron = [[5, 4, 5, 4], [4, 4, 5, 3], [5, 3, 4, 4], [3, 4, 3, 4]];
  for (const receta of creadas) {
    for (let u = 0; u < sesiones.length; u++) {
      if (u === receta.autor) continue;
      if ((receta.indice + u) % 5 === 4) continue;
      await pedir('PUT', `/recipes/${receta._id}/rating`, {
        token: sesiones[u].token,
        cuerpo: { stars: patron[receta.autor][(receta.indice + u) % 4] },
      });
    }
    const cantidad = 1 + (receta.indice % 3);
    for (let c = 0; c < cantidad; c++) {
      const u = (receta.autor + c + 1) % sesiones.length;
      await pedir('POST', `/recipes/${receta._id}/comments`, {
        token: sesiones[u].token,
        cuerpo: { text: comentarios[(receta.indice + c) % comentarios.length] },
      });
    }
  }
  console.log('Puntuaciones y comentarios cargados.');

  const notas = [
    'Quedó muy bien, le puse un poco más de sal.',
    'La usé para aprovechar lo que quedaba en el refri.',
    'Fácil y rápida, la repetiré.',
  ];
  for (const receta of creadas) {
    for (let u = 0; u < sesiones.length; u++) {
      if ((receta.indice + u) % 3 === 1) continue;
      await pedir('POST', `/recipes/${receta._id}/cooked`, {
        token: sesiones[u].token,
        cuerpo: {
          usedPantry: (receta.indice + u) % 4 !== 0,
          ...((receta.indice + u) % 5 === 0 ? { note: notas[(receta.indice + u) % notas.length] } : {}),
        },
      });
    }
  }
  console.log('Historial de recetas cocinadas cargado.');

  const nombresDeListas = ['Cenas rápidas', 'Para la semana', 'Postres y dulces', 'Aprovechar sobras'];
  for (let u = 0; u < sesiones.length; u++) {
    const { token } = sesiones[u];
    const listas = exigir(await pedir('GET', '/cookbook/lists', { token }), 'listas');
    const favoritas = listas.find((l) => l.isDefault);
    const propia = exigir(
      await pedir('POST', '/cookbook/lists', { token, cuerpo: { name: nombresDeListas[u] } }),
      'creación de lista',
    ).id ?? null;
    for (let k = 0; k < 4; k++) {
      const receta = creadas[(u * 3 + k * 2) % creadas.length];
      await pedir('PUT', `/cookbook/lists/${favoritas.id}/recipes/${receta._id}`, { token });
      if (propia && k % 2 === 0) {
        await pedir('PUT', `/cookbook/lists/${propia}/recipes/${receta._id}`, { token });
      }
    }
  }
  console.log('Listas del recetario cargadas.');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
