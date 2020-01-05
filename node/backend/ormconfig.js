module.exports = {
   "type": "postgres",
   "host":  process.env.H2X_MODE === "production" ? "h2x_db" : "localhost",
   "port": 5432,
   "username": "postgres",
   "password": "postgres",
   "database": "h2x",
   "synchronize": true,
   "logging": true,
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
