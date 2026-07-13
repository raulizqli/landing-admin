import { getHubDb, getHubStorage, getHubAuth } from './utils/firebaseClients';

const db = getHubDb();
const storage = getHubStorage();
const auth = getHubAuth();

export { db, storage, auth };
