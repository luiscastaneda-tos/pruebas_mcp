import "dotenv/config";

import app from "./app.js";
import { loadEnv } from "./core/config/env.js";

loadEnv();

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`MIA Backend Gateway disponible en el puerto ${String(port)}.`);
});
