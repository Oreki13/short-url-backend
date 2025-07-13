# Database Structure - Short URL Application

## Database Info

- **Type**: PostgreSQL
- **Connection**: Active
- **Tables**: 4 tables

## Table Structure

### users

- id (text/UUID) - Primary Key
- name (varchar)
- email (varchar)
- password (text) - bcrypt encrypted
- role_id (text/UUID) - Foreign Key
- created_at (timestamp)
- updated_at (timestamp)
- is_deleted (integer)

### tbl_data_url (Short URLs)

- id (text/UUID) - Primary Key
- title (varchar)
- destination (text) - Original URL
- path (varchar) - Short code
- count_clicks (integer)
- user_id (text/UUID) - Foreign Key to users
- created_at (timestamp)
- updated_at (timestamp)
- is_deleted (integer)

### role_user

- Role management table

### tokens

- Authentication tokens

## Sample Data

### Users:

- Admin (admin@mail.com)
- User (user@mail.com) - ID: f97917bb-9a7c-47dc-843f-86df47fbddcf
- Super Admin (superadmin@mail.com)

### Sample Short URLs (created by User):

- google123 → https://www.google.com (25 clicks)
- yt-home → https://www.youtube.com (12 clicks)
- gh-repo → https://github.com/example/awesome-project (8 clicks)
- so-help → https://stackoverflow.com/questions/12345/how-to-solve-this (18 clicks)
- laravel-docs → https://laravel.com/docs/11.x/installation (5 clicks)
