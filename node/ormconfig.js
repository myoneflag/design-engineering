module.exports = {
  "type": "postgres",
  "host":  process.env.RDS_HOSTNAME || process.env.DB_HOSTNAME || (process.env.MODE === "production" ? "db" : "db"),
  "port": process.env.RDS_PORT || process.env.DB_PORT || 5432,
  "username": process.env.RDS_USERNAME || process.env.DB_USERNAME || "postgres",
  "password": process.env.RDS_PASSWORD || process.env.DB_PASSWORD || "postgres",
  "database": process.env.RDS_DB_NAME || process.env.DB_NAME || "h2x",
  "synchronize": false,
  "logging": process.env.MODE === "production" ? false : true,
  "entities": [
    process.env.MODE === "production" ? "./dist/common/src/models/**/*{.ts,.js}" : "../common/src/models/**/*.ts"
  ],
  "migrations": [
    process.env.MODE === "production" ? "./dist/backend/src/migration/**/*{.ts,.js}" : "./src/migration/**/*.ts"
  ],
  "migrationsRun": true,
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
