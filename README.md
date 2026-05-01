# Sells & Inventory Manager API

RESTful API for managing users, brands, products, and sales in a grocery store context.

## Description

This is an API built for a selling and inventory management system that allows you to manage users, brands, products and sales in a simple way. It's designed to help my mom's grocery store track inventory and record sales efficiently.

## Features

- **Users**: Create and list users in the system.
- **Brands**: Create brands associated with a user. Brands are shared across all users (any user can see and use any brand).
- **Products**: Create products linked to any brand, list them, get one, or update stock.
- **Sales**: Register sales with multiple products. Stock is automatically decremented when a sale is created.

## Technologies

[![NestJS](https://skillicons.dev/icons?i=nestjs)](https://nestjs.com/)
[![Node.js](https://skillicons.dev/icons?i=nodejs)](https://nodejs.org/)
[![TypeScript](https://skillicons.dev/icons?i=typescript)](https://typescriptlang.org/)
[![MongoDB](https://skillicons.dev/icons?i=mongodb)](https://www.mongodb.com/)
[![Docker](https://skillicons.dev/icons?i=docker)](https://www.docker.com/)

## Prerequisites

- **Node.js**: v22.20.0 or higher
- **MongoDB**: v6.0 or higher (local or cloud instance)
- **NPM**: Comes with Node.js

## Installation

1. Clone the repository:

```bash
$ git clone <repository-url>
```

2. Install dependencies:

```bash
$ npm install
```

## Configuration

Define the following environment variables in a `.env` file:

| Variable     | Description                        | Default        |
|--------------|------------------------------------|----------------|
| PORT         | Server port number                 | 3000           |
| API_PREFIX   | API URL prefix                     | api            |
| MONGODB_URI  | MongoDB connection string         | mongodb://localhost:27017 |

Example `.env` file:

```bash
PORT=3000
API_PREFIX=api
MONGODB_URI=mongodb://localhost:27017
```

## Usage

Start the development server:

```bash
$ npm run start:dev
```

The API will be available at `http://localhost:3000/api`.

For production:

```bash
$ npm start
```

## Docker Compose

### Prerequisites

- **Docker**: v24.0 or higher
- **Docker Compose**: v2.0 or higher (included with Docker Desktop)

### Quick Start

1. Clone the repository:

```bash
$ git clone <repository-url>
```

2. Create a `.env` file (optional — defaults will be used):

```bash
PORT=3000
API_PREFIX=api
MONGODB_URI=mongodb://mongo:27017
```

3. Start the API and MongoDB:

```bash
$ docker compose up -d
```

The API will be available at `http://localhost:3000/api` and MongoDB at `localhost:27017`.

### Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services in detached mode |
| `docker compose up` | Start and show logs |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop and remove volumes (data loss!) |
| `docker compose build` | Rebuild the API image |
| `docker compose logs -f` | Follow logs |
| `docker compose logs -f api` | Follow API logs only |
| `docker compose restart` | Restart all services |

### Configuration

When using Docker Compose, the following environment variables are used:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| API_PREFIX | api | API URL prefix |
| MONGODB_URI | mongodb://mongo:27017 | MongoDB connection (use `mongo` hostname) |

### Building without Compose (Optional)

If you need to run the container manually:

Build the image:

```bash
$ docker build -t sells-inventory-api .
```

Run the container:

```bash
$ docker run -p 3000:3000 -e MONGODB_URI=mongodb://host.docker.internal:27017 sells-inventory-api
```

> **Note**: On Windows, use `host.docker.internal` to connect to MongoDB running locally.

## Documentation

Full API documentation is available in [api.md](./api.md), which includes:

- All available endpoints
- Request/response formats
- Request examples
- Error responses

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to run tests before submitting (`npm run test`).

## License

This project is licensed under the MIT License - see the [LICENSE.txt](./LICENSE.txt) file for details.

---

Developed with ❤️ by [Enmanuel Ferrer](https://www.linkedin.com/in/enmanuelferrer)

[![Enmanuel Ferrer](https://skillicons.dev/icons?i=linkedin)](https://www.linkedin.com/in/enmanuelferrer)