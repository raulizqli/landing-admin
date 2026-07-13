import { getHubDb } from './utils/firebaseClients';

const PAGE_ID = import.meta.env.VITE_PAGINA_ID;

const db = getHubDb();

export { db, PAGE_ID };
