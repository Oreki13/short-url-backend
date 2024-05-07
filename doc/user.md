# User API Spec

## Create User

Endpoint : POST /user/create

Request Header :
- authorization : token
- x-control-user : userID

Request Body :
```json
{
  "name": "fandy",
  "email": "fandy@mail.com",
  "password": "rahasia",
  "role_id": "uid"
}
```

Response Body (Success) :
```json
{
  "status": "OK",
  "code": "SUCCESS",
  "message": null,
  "data": {
    "id": "user_id",
    "name": "fandy",
    "email": "fandy@mail.com",
    "role": {
      "name": "user"
    }
  }
}
```

Response Body (Failed: Unauthorized)(401) :
```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": "Only admin can access this feature",
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

Response Body (Failed: User Exist) (400) :
```json
{
  "status": "ERROR",
  "code": "USER_ALREADY_EXISTS",
  "message": "User already exists",
  "data": null
}
```

Response Body (Failed: Role not Exist) (400) :
```json
{
  "status": "ERROR",
  "code": "ROLE_NOT_EXIST",
  "message": "Role does not exist",
  "data": null
}
```

Response Body (Failed: Unauthorized) (401) :
```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": "Only admin can access this feature",
  "data": null
}
```

## Login User

Endpoint : POST /auth/login

Request Body :
```json
{
  "email": "fandy@mail.com",
  "password": "rahasia"
}
```

Response Body (Success) (200) :
```json
{
  "status": "OK",
  "code": "SUCCESS",
  "message": null,
  "data": "token"
}
```

Response Body (Failed: Invalid credential) (404) :
```json
{
  "status": "ERROR",
  "code": "INVALID_CREDENTIAL",
  "message": "Credential is invalid",
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

## Get List User

Endpoint : GET /user/

Request Header :
- authorization : token
- x-control-user : userID

Request Body :
```json
{
  "page": "1",
  "limit": "5",
  "keyword": "",
  "sort": "asc | desc"
}
```

Response Body (Success) :
```json
{
  "status": "OK",
  "code": "SUCCESS",
  "message": null,
  "data": {
    "data": [
      {
        "id": "ff84ab03-e62f-4c7c-8327-abd0f3582edf",
        "name": "user_test",
        "email": "testemail@test.com",
        "role": {
          "name": "user"
        },
        "createdAt": "2024-04-27T08:29:36.515Z",
        "updatedAt": "2024-04-27T08:29:36.515Z"
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

Response Body (Failed: Unauthorized) (401) :
```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": "Only admin can access this feature",
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

## Delete User

Endpoint : DELETE /user/:id

Request Header :
- authorization : token
- x-control-user : userID

Response Body (Success) :
```json
{
  "status": "OK",
  "code": "SUCCESS",
  "message": "username has been successfully deleted.",
  "data": null
}
```

Response Body (Failed: Unauthorized)(401) :
```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": "Only admin can access this feature",
  "data": null
}
```

Response Body (Failed: User not Exist) (404) :
```json
{
  "status": "ERROR",
  "code": "USER_NOT_EXIST",
  "message": "User does not exist",
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

## Find User By ID

Endpoint : GET /user/:id

Request Header :
- authorization : token
- x-control-user : userID

Response Body (Success) :
```json
{
  "status": "OK",
  "code": "SUCCESS",
  "message": null,
  "data": {
    "id": "uuid",
    "name": "fandy",
    "email": "fandy@mail.com",
    "role": {
      "name": "user"
    },
    "createdAt": "DateTime",
    "updatedAt": "DateTime"
  }
}
```

Response Body (Failed: User not Exist) (404) :
```json
{
  "status": "ERROR",
  "code": "USER_NOT_EXIST",
  "message": "User does not exist",
  "data": null
}
```

Response Body (Failed: Unauthorized)(401) :
```json
{
  "status": "ERROR",
  "code": "UNAUTHORIZED",
  "message": "Only admin can access this feature",
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