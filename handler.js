const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

// Nombre de la tabla desde la variable de entorno
const TABLE = process.env.LIBROS_TABLE;

// Cliente creado fuera de los handlers para reutilizarlo entre invocaciones
const db = DynamoDBDocumentClient.from(new DynamoDBClient());

// Arma la respuesta HTTP
const respuesta = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Convierte el body a objeto; devuelve null si no es JSON válido
const leerBody = (event) => {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return null;
  }
};

// Validación común para crear y actualizar
const validar = (data) => {
  if (!data) return "El cuerpo debe ser un JSON válido";
  if (typeof data.titulo !== "string" || !data.titulo.trim())
    return '"titulo" es obligatorio y debe ser texto';
  if (typeof data.autor !== "string" || !data.autor.trim())
    return '"autor" es obligatorio y debe ser texto';
  if (!Number.isInteger(data.paginas) || data.paginas <= 0)
    return '"paginas" es obligatorio y debe ser un entero mayor que 0';
  if (data.genero !== undefined && typeof data.genero !== "string")
    return '"genero" debe ser texto';
  return null;
};

// POST /libros
module.exports.crear = async (event) => {
  const data = leerBody(event);
  const error = validar(data);
  if (error) return respuesta(400, { error });

  const item = {
    id: randomUUID(),
    titulo: data.titulo.trim(),
    autor: data.autor.trim(),
    paginas: data.paginas,
    genero: data.genero ?? "General",
  };

  try {
    await db.send(new PutCommand({ TableName: TABLE, Item: item }));
    return respuesta(201, item);
  } catch (err) {
    console.error(err);
    return respuesta(500, { error: "No fue posible crear el libro" });
  }
};

// GET /libros
module.exports.listar = async () => {
  try {
    const { Items } = await db.send(new ScanCommand({ TableName: TABLE }));
    return respuesta(200, Items);
  } catch (err) {
    console.error(err);
    return respuesta(500, { error: "No fue posible listar los libros" });
  }
};

// GET /libros/{id}
module.exports.obtener = async (event) => {
  const { id } = event.pathParameters;
  try {
    const { Item } = await db.send(
      new GetCommand({ TableName: TABLE, Key: { id } })
    );
    if (!Item) return respuesta(404, { error: "Libro no encontrado" });
    return respuesta(200, Item);
  } catch (err) {
    console.error(err);
    return respuesta(500, { error: "No fue posible consultar el libro" });
  }
};

// PUT /libros/{id}
module.exports.actualizar = async (event) => {
  const { id } = event.pathParameters;
  const data = leerBody(event);
  const error = validar(data);
  if (error) return respuesta(400, { error });

  try {
    const { Attributes } = await db.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression:
          "SET titulo = :titulo, autor = :autor, paginas = :paginas, genero = :genero",
        ExpressionAttributeValues: {
          ":titulo": data.titulo.trim(),
          ":autor": data.autor.trim(),
          ":paginas": data.paginas,
          ":genero": data.genero ?? "General",
        },
  
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_NEW",
      })
    );
    return respuesta(200, Attributes);
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return respuesta(404, { error: "Libro no encontrado" });
    }
    console.error(err);
    return respuesta(500, { error: "No fue posible actualizar el libro" });
  }
};

// DELETE /libros/{id}
module.exports.eliminar = async (event) => {
  const { id } = event.pathParameters;
  try {
    await db.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { id },
        // Solo elimina si el libro existe; si no, lanza ConditionalCheckFailedException
        ConditionExpression: "attribute_exists(id)",
      })
    );
    return respuesta(200, { mensaje: `Libro ${id} eliminado correctamente` });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return respuesta(404, { error: "Libro no encontrado" });
    }
    console.error(err);
    return respuesta(500, { error: "No fue posible eliminar el libro" });
  }
};