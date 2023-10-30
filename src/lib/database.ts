import { Db, MongoClient } from "mongodb";

const MONGODB_HOST = "localhost";
const MONGODB_PORT = 27017;

export class Database {
  private db?: Db;
  private static instance: Database;

  private constructor() {}

  async init() {
    const client = new MongoClient(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}`);
    await client.connect();
    this.db = client.db("golf");
  }

  public static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }

  getDb() {
    if (!this.db) {
      throw new Error("DB is not init");
    }

    return this.db;
  }
}
