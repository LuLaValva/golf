import {
  createHandler,
  renderAsync,
  StartServer,
} from "solid-start/entry-server";
import { Database } from "./lib/database";

const db = Database.getInstance();
db.init();

export default createHandler(
  renderAsync((event) => <StartServer event={event} />)
);
