# CRUD Serverless de Libros

API REST serverless para administrar libros, construida con **AWS Lambda**, **API Gateway (HTTP API)** y **Amazon DynamoDB**, desplegada con **Serverless Framework v4**.

## Entidad: Libro

| Atributo | Tipo | Obligatorio |
|---|---|---|
| `id` | string (UUID, partition key) | Generado automáticamente |
| `titulo` | string | Sí |
| `autor` | string | Sí |
| `paginas` | entero > 0 | Sí |
| `genero` | string | No (por defecto `"General"`) |

## Endpoints

| Método | Ruta | Función | Respuestas |
|---|---|---|---|
| POST | `/libros` | crear | 201 · 400 · 500 |
| GET | `/libros` | listar | 200 · 500 |
| GET | `/libros/{id}` | obtener | 200 · 404 · 500 |
| PUT | `/libros/{id}` | actualizar | 200 · 400 · 404 · 500 |
| DELETE | `/libros/{id}` | eliminar | 200 · 404 · 500 |

## Requisitos

- Node.js 20 o superior
- Serverless Framework v4 (`npm install -g serverless`)
- Cuenta en [app.serverless.com](https://app.serverless.com) y cuenta de AWS con credenciales configuradas
- Postman o Insomnia

## Instalación

```bash
git clone <url-del-repositorio>
cd crud-book
npm install
```

Antes de desplegar, cambiar `org` y `app` en `serverless.yml` por los de su cuenta de Serverless.

## Despliegue en AWS

```bash
serverless deploy
```

Al finalizar, la terminal muestra las URLs de los endpoints. La tabla creada en DynamoDB se llama `crud-book-libros-dev`.

## Ejecución local

Requiere haber desplegado primero, ya que el modo offline usa la tabla real de AWS.

```bash
serverless offline
```

La API queda disponible en `http://localhost:3000/libros`.

## Pruebas

Importar en Postman la colección ubicada en `postman/` y ajustar la variable `baseUrl`:

- AWS: `https://<api-id>.execute-api.us-east-1.amazonaws.com`
- Local: `http://localhost:3000`

Ejemplo de body para crear o actualizar:

```json
{
  "titulo": "Cien años de soledad",
  "autor": "Gabriel García Márquez",
  "paginas": 471,
  "genero": "Novela"
}
```

## Eliminar los recursos

```bash
serverless remove
```
