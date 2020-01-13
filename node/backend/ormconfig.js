module.exports = {
   "type": "postgres",
   "host":  process.env.H2X_MODE === "production" ? "db" : "localhost",
   "port": 5432,
   "username": "postgres",
   "password": "postgres",
   "database": "h2x",
   "synchronize": true,
   "logging": false,
   "entities": [
      "./src/entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "migrationsTableName": "migrations",
   "subscribers": [
      "src/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
   }
};