# API Documentation

Base URL: `http://localhost:3000/api`

---

## Users

### Create User

Creates a new user in the system.

- **Endpoint:** `POST /users`
- **URL:** `/users`
- **Body:**

```json
{
  "username": "string (3-20 chars)",
  "password": "string (min 8 chars, 1 lowercase, 1 uppercase, 1 number, 1 symbol)",
  "rol": "string (optional) - user | admin | superadmin"
}
```

- **Response:** Returns the created user object.

---

### Get All Users

Returns a paginated list of all users.

- **Endpoint:** `GET /users`
- **URL:** `/users`
- **Query Parameters:**

| Parameter | Type   | Default | Constraints    |
|-----------|--------|---------|----------------|
| limit     | number | 25      | 1-25           |
| skip      | number | 0       | >= 0           |

- **Response:** Returns paginated users `{ items, totalItems, totalPages, skip, limit }`.

---

### Get User by ID

Returns a single user by ID.

- **Endpoint:** `GET /users/:id`
- **URL:** `/users/:id`
- **Path Parameters:**
  - `id` - User's MongoDB ObjectId

- **Response:** Returns the user object.

---

## Brands

### Create Brand

Creates a new brand associated with a user.

- **Endpoint:** `POST /users/:userId/brands`
- **URL:** `/users/:userId/brands`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId

- **Body:**

```json
{
  "name": "string (3-20 chars)"
}
```

- **Response:** Returns the created brand object with the user linked.

---

### Get All Brands

Returns a paginated list of brands for a specific user.

- **Endpoint:** `GET /users/:userId/brands`
- **URL:** `/users/:userId/brands`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId

- **Query Parameters:**

| Parameter | Type   | Default | Constraints    |
|-----------|--------|---------|----------------|
| limit     | number | 25      | 1-25           |
| skip      | number | 0       | >= 0           |

- **Response:** Returns paginated brands `{ items, totalItems, totalPages, skip, limit }`.

---

### Get Brand by ID

Returns a single brand by ID for a specific user.

- **Endpoint:** `GET /users/:userId/brands/:brandId`
- **URL:** `/users/:userId/brands/:brandId`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId
  - `brandId` - Brand's MongoDB ObjectId

- **Response:** Returns the brand object.

---

## Products

### Create Product

Creates a new product in a specific brand.

- **Endpoint:** `POST /users/:userId/brands/:brandId/products`
- **URL:** `/users/:userId/brands/:brandId/products`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId
  - `brandId` - Brand's MongoDB ObjectId

- **Body:**

```json
{
  "name": "string (3-20 chars)",
  "cost": "number (>= 0)",
  "gain": "number (optional, >= 0)",
  "price": "number (optional, >= 0)"
}
```

**Notes:**
- Either `gain` OR `price` must be provided, but not both.
- If `price` is provided, gain is calculated automatically.
- If `gain` is provided, price is calculated automatically.
- Price must be greater than cost, and gain must not exceed 30%.

- **Response:** Returns the created product object.

---

### Get All Products

Returns a paginated list of products for a specific user.

- **Endpoint:** `GET /users/:userId/brands/:brandId/products`
- **URL:** `/users/:userId/brands/:brandId/products`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId

- **Query Parameters:**

| Parameter | Type   | Default | Constraints    |
|-----------|--------|---------|----------------|
| limit     | number | 25      | 1-25           |
| skip      | number | 0       | >= 0           |

- **Response:** Returns paginated products `{ items, totalItems, totalPages, skip, limit }`.

---

### Get Product by ID

Returns a single product by ID.

- **Endpoint:** `GET /users/:userId/brands/:brandId/products/:productId`
- **URL:** `/users/:userId/brands/:brandId/products/:productId`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId
  - `brandId` - Brand's MongoDB ObjectId
  - `productId` - Product's MongoDB ObjectId

- **Response:** Returns the product object.

---

### Update Product Stock

Performs a stock operation (increment or decrement) on a product.

- **Endpoint:** `PATCH /users/:userId/brands/:brandId/products/:productId`
- **URL:** `/users/:userId/brands/:brandId/products/:productId`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId
  - `productId` - Product's MongoDB ObjectId

- **Body:**

```json
{
  "operation": "increment | decrement",
  "quantity": "number (positive integer)"
}
```

- **Response:** Returns the updated product object.

---

## Sales

### Create Sale

Creates a new sale for a user.

- **Endpoint:** `POST /users/:userId/sales`
- **URL:** `/users/:userId/sales`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId

- **Body:**

```json
{
  "saleProducts": [
    {
      "productId": "MongoDB ObjectId",
      "quantity": "number (positive)"
    }
  ]
}
```

**Notes:**
- At least one product is required.
- Products must exist and belong to the user.
- Stock is automatically decremented for each product.

- **Response:** Returns the created sale object with total calculated.

---

### Get All Sales

Returns a paginated list of sales for a specific user.

- **Endpoint:** `GET /users/:userId/sales`
- **URL:** `/users/:userId/sales`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId

- **Query Parameters:**

| Parameter | Type   | Default | Constraints    |
|-----------|--------|---------|----------------|
| limit     | number | 25      | 1-25           |
| skip      | number | 0       | >= 0           |

- **Response:** Returns paginated sales `{ items, totalItems, totalPages, skip, limit }`.

---

### Get Sale by ID

Returns a single sale by ID for a specific user.

- **Endpoint:** `GET /users/:userId/sales/:saleId`
- **URL:** `/users/:userId/sales/:saleId`
- **Path Parameters:**
  - `userId` - User's MongoDB ObjectId
  - `saleId` - Sale's MongoDB ObjectId

- **Response:** Returns the sale object.

---

## Error Responses

All endpoints may return the following error responses:

| Status Code | Description |
|-------------|-------------|
| 400         | Bad Request - Invalid input data |
| 404         | Not Found - Resource not found |
| 409         | Conflict - Resource already exists |
| 500         | Internal Server Error |

---

## Notes

- All IDs in URL parameters must be valid MongoDB ObjectIds.
- The API uses pagination with a default limit of 25 items per page.
- Authentication and authorization are not currently implemented.
- All request bodies must be valid JSON.