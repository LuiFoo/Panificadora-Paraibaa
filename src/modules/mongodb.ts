import { MongoClient, ServerApiVersion } from "mongodb";

// Use default MongoDB URI if not provided
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/paraiba";
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
  
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = globalWithMongo._mongoClient.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
export { clientPromise };