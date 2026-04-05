import { env } from "./config/env";
import { server } from "./app";

server.listen(env.PORT, () => {
  console.log(`VANI API listening on http://localhost:${env.PORT}`);
});
