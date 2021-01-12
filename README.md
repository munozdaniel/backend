<p align="center">
  <a href="https://expressjs.com/" target="blank"><img src="http://wanago.io/express.png" width="320" alt="Express Logo" /></a>
</p>

## Description

This repository is a part of the [Express Typescript tutorial](https://wanago.io/courses/typescript-express-tutorial/).

Each part of the course has its own branch, called for example [_part-1_](https://github.com/mwanago/express-typescript/tree/part-1).

The the [_master_](https://github.com/mwanago/express-typescript) branch represents the version with **MongoDB**.

The [_postgres_](https://github.com/mwanago/express-typescript/tree/postgres) branch contains the version with **PostgreSQL**.

## Installation

```bash
npm install
```

## Running

```bash
npm run dev
```

## Testing

```bash
npm run test
```

# Cargar BD
## Insertar Marcas
http://127.0.0.1:5000/marcas/insertarMagia
## Insertar Pesos (kg)
http://127.0.0.1:5000/pesos/insertarMagia



## Crear usuario
db.createUser(
{	user: "adminEscuela",
	pwd: "123456",

	roles:[{role: "userAdmin" , db:"escuela"}]})

