# Short Link (BE)

This is the backend of a shortlink application like Bitly,
build using express js.

### Recruitment
1. NodeJS >= 18.15.0
2. PostgresSQL

### API Spec
- [User Api Spec](https://github.com/Oreki13/short-url-backend/blob/main/doc/user.md)
- [Short Link Api Spec](https://github.com/Oreki13/short-url-backend/blob/main/doc/short_link.md)

### Installation
1. Clone this repository
```bash
git clone https://github.com/Oreki13/short-url-backend.git
```
2. Rename `.env.example` to `.env` and change DATABASE_URL
```text
DATABASE_URL="postgresql://postgres:your_db_password@localhost:5432/your_db_name"
```
3. Open project folder on terminal and run
```bash
npm install
```
4. Run database migration
```bash
npx prisma migrate dev
```

5. Run database seeder
```bash
npx prisma db seed
```
6. Run app
```bash
npm run build && npm start
```


