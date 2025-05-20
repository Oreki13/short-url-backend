# Domain API Spec

## Tests

A comprehensive test suite has been implemented for the Domain API in `/test/domain.test.ts`. The test suite covers:

- Listing domains with pagination and search
- Creating new domains
- Updating existing domains
- Deleting domains
- Setting default domains
- Error handling for invalid inputs
- Authentication requirements

These tests use the same pattern as other tests in the application, leveraging the `AuthUserTest` helper for authentication and creating a new `DomainTest` helper for domain-specific operations.

## Get All Domains

Endpoint : GET /v1/domain/

Request Header :

- authorization : token
- x-control-user : userID

Request Parameters :

```
page=1
limit=5
keyword=""
sort="asc | desc"
```

Response Body :

```json
{
  "status": "OK",
  "code": "SUCCESS",
  "message": null,
  "data": {
    "data": [
      {
        "id": "uuid",
        "domain": "example.com",
        "is_default": 1,
        "is_deleted": 0,
        "user": {
          "id": "uuid",
          "name": "User Name"
        },
        "createdAt": "2024-05-20T06:55:17.562Z",
        "updatedAt": "2024-05-20T06:55:17.562Z"
      }
    ],
    "paging": {
      "current_page": 1,
      "size": 5,
      "total_data": 1,
      "total_page": 1
    }
  }
}
```

Response Body (Failed: Unauthorized)(401) :

```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": null,
  "data": null
}
```

Response Body (Failed: Error Validation) (400) :

```json
{
  "status": "ERROR",
  "code": "ERROR_VALIDATION",
  "message": null,
  "data": "..."
}
```

## Create Domain

Endpoint : POST /v1/domain/

Request Header :

- authorization : token
- x-control-user : userID

Request Body :

```json
{
  "domain": "https://example.com",
  "is_default": 1
}
```

Response Body (Success) :

```json
{
  "status": "OK",
  "code": "SUCCESS_ADD_DOMAIN",
  "message": null,
  "data": {
    "domain": "example.com",
    "id": "uuid",
    "is_default": 1
  }
}
```

Response Body (Failed: Unauthorized)(401) :

```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": null,
  "data": null
}
```

Response Body (Failed: Error Validation) (400) :

```json
{
  "status": "ERROR",
  "code": "ERROR_VALIDATION",
  "message": null,
  "data": "..."
}
```

Response Body (Failed: Domain already exist) (400) :

```json
{
  "status": "ERROR",
  "code": "DATA_ALREADY_EXIST",
  "message": "Domain has already been registered",
  "data": null
}
```

## Delete Domain

Endpoint : DELETE /v1/domain/:id

Request Header :

- authorization : token
- x-control-user : userID

Response Body (Success) :

```json
{
  "status": "OK",
  "code": "SUCCESS_DELETE_DOMAIN",
  "message": "Domain has been successfully deleted.",
  "data": {
    "id": "uuid",
    "domain": "example.com",
    "is_default": 1
  }
}
```

Response Body (Failed: Unauthorized)(401) :

```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": null,
  "data": null
}
```

Response Body (Failed: Domain not Exist) (404) :

```json
{
  "status": "ERROR",
  "code": "DATA_NOT_EXIST",
  "message": "Domain does not exist",
  "data": null
}
```

## Update Domain

Endpoint : PUT /v1/domain/:id
Request Header :

- authorization : token
- x-control-user : userID

Request Body :

```json
{
  "domain": "https://updated-example.com",
  "is_default": 1
}
```

Response Body (Success) :

```json
{
  "status": "OK",
  "code": "SUCCESS_UPDATE_DOMAIN",
  "message": null,
  "data": {
    "id": "uuid",
    "domain": "updated-example.com",
    "is_default": 1
  }
}
```

Response Body (Failed: Unauthorized)(401) :

```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": null,
  "data": null
}
```

Response Body (Failed: Error Validation) (400) :

```json
{
  "status": "ERROR",
  "code": "ERROR_VALIDATION",
  "message": null,
  "data": "..."
}
```

Response Body (Failed: Domain not Exist) (404) :

```json
{
  "status": "ERROR",
  "code": "DATA_NOT_EXIST",
  "message": "Domain does not exist",
  "data": null
}
```

## Set Default Domain

Endpoint : POST /v1/domain/set-default

Request Header :

- authorization : token
- x-control-user : userID

Request Body :

```json
{
  "domain_id": "uuid"
}
```

Response Body (Success) :

```json
{
  "status": "OK",
  "code": "SUCCESS_SET_DEFAULT_DOMAIN",
  "message": "Default domain has been successfully set.",
  "data": {
    "id": "uuid",
    "domain": "example.com",
    "is_default": 1
  }
}
```

Response Body (Failed: Unauthorized)(401) :

```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": null,
  "data": null
}
```

Response Body (Failed: Error Validation) (400) :

```json
{
  "status": "ERROR",
  "code": "ERROR_VALIDATION",
  "message": null,
  "data": "..."
}
```

Response Body (Failed: Domain not Exist) (404) :

```json
{
  "status": "ERROR",
  "code": "DATA_NOT_EXIST",
  "message": "Domain does not exist",
  "data": null
}
```
