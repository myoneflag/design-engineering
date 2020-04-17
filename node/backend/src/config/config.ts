import * as dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT || '3000',
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || undefined,
    AWS_SECRET: process.env.AWS_SECRET || undefined,
    FRONTEND_REL_PATH: process.env.MODE === "production" ? "../../../../frontend/dist" : "../../frontend/dist",


    MQ_URL: process.env.MQ_URL || "ws://127.0.0.1:61614",
    MQ_USERNAME: process.env.MQ_USERNAME || 'admin',
    MQ_PASSWORD: process.env.MQ_PASSWORD || 'admin',
};
