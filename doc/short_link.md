# Short Link API Spec

## Get all list short link

Endpoint : GET /v1/short/

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
        "title": "google",
        "back_half": "open-google",
        "count_clicks": 0,
        "destination": "https://google.com",
        "user": {
          "id": "uuid",
          "name": "Super Admin"
        },
        "createdAt": "2024-04-29T06:55:17.562Z",
        "updatedAt": "2024-04-29T06:55:17.562Z"
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

## Create Short Link

Endpoint : POST /v1/short/

Request Header :

- authorization : token
- x-control-user : userID

Request Body :

```json
{
  "title": "Link Google",
  "destination": "https://google.com",
  "path": "path/"
}
```

Response Body (Success) :

```json
{
  "status": "OK",
  "code": "SUCCESS_ADD_LINK",
  "message": null,
  "data": {
    "back_half": "path",
    "destination": "https://google.com/",
    "id": "uuid",
    "title": "Link Google"
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

Response Body (Failed: Data already exist) (400) :

```json
{
  "status": "ERROR",
  "code": "DATA_ALREADY_EXIST",
  "message": "Title or path has exist",
  "data": null
}
```

## Delete Short Link

Endpoint : DELETE /v1/short/:id

Request Header :

- authorization : token
- x-control-user : userID

Response Body (Success) :

```json
{
  "status": "OK",
  "code": "SUCCESS",
  "message": "Short link has been successfully deleted.",
  "data": null
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

Response Body (Failed: User not Exist) (404) :

```json
{
  "status": "ERROR",
  "code": "DATA_NOT_EXIST",
  "message": "Data short link does not exist",
  "data": null
}
```

## Edit Short Link

Endpoint : PATCH /v1/short/:id

Request Header :

- authorization : token
- x-control-user : userID

Request Body :

```json
{
  "title": "Link Google Edit",
  "destination": "https://google.com",
  "path": "path"
}
```

Response Body (Success) :

```json
{
  "status": "OK",
  "code": "SUCCESS_EDIT_DATA",
  "message": null,
  "data": {
    "back_half": "path",
    "destination": "https://google.com/",
    "id": "uuid",
    "title": "Link Google Edit"
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

Response Body (Failed: User not Exist) (404) :

```json
{
  "status": "ERROR",
  "code": "DATA_NOT_EXIST",
  "message": "Data short link does not exist",
  "data": null
}
```
