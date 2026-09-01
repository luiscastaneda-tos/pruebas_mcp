import cors from "cors";
import express from "express";

import { HeaderContextResolver, createAuthMiddleware } from "./core/middleware/auth.js";
import { errorHandler } from "./core/middleware/errorHandler.js";

export const app = express();

app.disable("x-powered-by");
app.use(cors());

app.get("/health", async (request, response) => {
  if (!request.readableEnded) {
    await new Promise<void>((resolve) => {
      request.once("end", resolve);
      request.once("close", resolve);
      request.resume();
    });
  }

  response.status(200).json({
    success: true,
    message: "Servicio disponible.",
    data: { status: "ok" },
  });
});

app.use(express.json());
app.use(createAuthMiddleware(new HeaderContextResolver()));
app.use(errorHandler);

export default app;
