import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { healthRouter } from "./routes/health.js";
import { paymentsRouter } from "./routes/payments.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/v1", healthRouter);
app.use("/api/v1/payments", paymentsRouter);

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
