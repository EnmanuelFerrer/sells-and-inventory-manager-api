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