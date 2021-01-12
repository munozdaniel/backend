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



## Crear usuarios mercado pago
https://api.mercadopago.com/users/test_user?access_token=TEST-75849391691048-120115-bfff5f6b27e1aedbd20ad329998843d7-170413421 

curl -X POST \
-H "Content-Type: application/json" \
-H 'Authorization: Bearer APP_USR-75849391691048-120115-2489131b15a4bca1146bc37223b5dab4-170413421' \
"https://api.mercadopago.com/users/test_user" \
-d '{"site_id":"MLA"}'
