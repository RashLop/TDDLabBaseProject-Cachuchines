#### Proyeto base para proyectos tddlab:

#### Creado a partir de proyecto usado en IngSoftware: parcel-jest-base

https://github.com/israelantezana/parcel-jest-base

#### Comandos creados en package json:

#### Para instalar las dependencias:

npm install

#### Comandos de uso:

Ejecutar web-sever local parcel:
npm start

Ejecutar pruebas de unidad de forma continua --watch:
npm test

Ejecutar pruebas de unidad solo una vez:
npm run test-once

### Integración con TDDLab

Después de cada commit, el hook de Husky publica en TDDLab el resultado de las pruebas asociado al SHA final del commit.

Por defecto usa `http://localhost:3000/api/TDDCycles/branch-tracking/ingest`. Para apuntar a otra instancia:

```bash
TDDLAB_API_URL=https://tu-instancia/api/TDDCycles/branch-tracking/ingest git commit -m "mensaje"
```

La publicación es opcional para no bloquear commits cuando la API no está disponible. Para hacerla obligatoria, usa `TDDLAB_API_REQUIRED=1`.
