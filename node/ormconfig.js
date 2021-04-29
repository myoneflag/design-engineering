const AWS = require("aws-sdk");

const type = "postgres"
const host = process.env.RDS_HOSTNAME || process.env.DB_HOSTNAME || "db"
const port = process.env.RDS_PORT || process.env.DB_PORT || 5432
const username = process.env.RDS_USERNAME || process.env.DB_USERNAME || "postgres"
const database = process.env.RDS_DB_NAME || process.env.DB_NAME || "h2x"
const password = process.env.RDS_PASSWORD || process.env.DB_PASSWORD || "postgres"

module.exports = {
  type,
  host,
  port,
  username,
  password: async () => {
    if (!password) {
      const signer = new AWS.RDS.Signer({
        region: (new AWS.Config()).region,
        hostname: host,
        port: port,
        username: username,
      });
      return signer.getAuthToken({});
    }
    return password;
  },
  database,
  synchronize: false,
  logging: process.env.MODE === "production" ? false : true,
  entities: [
    process.env.MODE === "production" ? "./dist/common/src/models/**/*{.ts,.js}" : "../common/src/models/**/*.ts"
  ],
  migrations: [
    process.env.MODE === "production" ? "./dist/backend/src/migration/**/*{.ts,.js}" : "./src/migration/**/*.ts"
  ],
  migrationsRun: true,
  migrationsTableName: "migrations",
  subscribers: [
    "./src/subscriber/**/*.ts"
  ],
  cli: {
    "entitiesDir": "../common/src/models",
    "migrationsDir": "./src/migration",
    "subscribersDir": "./src/subscriber"
  }
};
