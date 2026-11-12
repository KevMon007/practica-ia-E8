# AI Support Engine

Prototipo de clasificación inteligente de solicitudes de soporte desarrollado con Node.js y Express. El proyecto compara un motor tradicional basado en reglas con un motor generativo integrado mediante la API de NVIDIA.

## Colaboradores

- Juan Andres Medina Gonzalez
- José Ismael Montalvo Lopez
- Kevin Armando Montalvo Marcial

## Requisitos

- Node.js 18 o superior
- Una clave de la API de NVIDIA para utilizar el motor generativo

## Configuración inicial

```bash
npm install
```

Copia `.env.example` como `.env` y agrega las variables requeridas. Nunca publiques el archivo `.env` ni una clave real de la API.

## Ejecución

```bash
npm start
```

El servicio expone una ruta de salud en `GET /health` y el endpoint de análisis en `POST /api/analyze`.
