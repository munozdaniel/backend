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
{ user: "adminEscuela",
pwd: "123456",

    roles:[{role: "userAdmin" , db:"escuela"}]})

# PASOS MIGRACION

## migrar nuevo analisis

localhost:8083/api/comisiones/migrar-unicas
localhost:8083/api/alumnos/migrar

## migrar alumnos

alumnos/migrar
asignaturas/migrar
comisiones/migrar // no hace falta se hacen en alumnos/migrar
comisiones/migraralumnos // no hace falta se hacen en alumnos/migrar
planilla-taller/migrar
seguimiento-alumnos/migrar
Tablas originales

alumnooriginals <<mod>>
alumnos_por_comisiones
alumnos_por_taller
asignaturaoriginals <<mod>>
asignaturas_por_profesor
asistencia_dias
calendario_por_ciclo_lectivo
planilla_de_asistencia_por_alumnos
planilla_de_calificaciones_por_alumno
planilla_de_tallers (planilla_de_taller) <<mod>>
planilla_temario_por_dia
planillaaportesdetaller
profesoresoriginals <<mod>>
seguimiento_de_alumnos

# comandos

## Backup de la bd sacando la seguridad de la configuracion /etc/mongod.conf

sudo mongodump --username adminEscuela --password 'system2021$cet30' --db sega30 --out /var/backups/mongobackups/`date +"%m-%d-%y"`--gzip --authenticationDatabase admin

mongodump --port 27017 --db sega30 --username adminEscuela --password 'system2021$cet30' --out /www/cet30.com/mongodb-autoBackup/database-backup-mongodump-2021-8-1

# PRODUCCION

pm2 delete npm
pm2 start npm -- run prod
pm2 startup
pm2 save

https://www.youtube.com/watch?v=JlM81PN9OP4

Para exportar collections en MongoCompass

1. Cerrar todo
2. Abrir e ingresar la siguiente conexion

mongodb://adminEscuela:system2021$cet30@app.cet30.edu.ar:27017
