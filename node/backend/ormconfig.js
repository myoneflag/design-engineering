module.exports = {
   "type": "postgres",
    "host":  process.env.H2X_DATABASE || (process.env.H2X_MODE === "production" ? "db" : "localhost"),
    "port": 5432,
   "username": "postgres",
   "password": "postgres",
   "database": "h2x3",
   "synchronize": false,
   "logging": process.env.H2X_MODE === "production" ? false : true,
   "entities": [
       process.env.H2X_MODE === "production" ? "./dist/common/src/models/**/*{.ts,.js}" : "../common/src/models/**/*.ts"
   ],
   "migrations": [
       process.env.H2X_MODE === "production" ? "./dist/backend/src/migration/**/*{.ts,.js}" : "./src/migration/**/*.ts"
   ],
    "migrationsRun": false,
   "migrationsTableName": "migrations",
   "subscribers": [
      "./src/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "../common/src/models",
      "migrationsDir": "./src/migration",
      "subscribersDir": "./src/subscriber"
   }
};
