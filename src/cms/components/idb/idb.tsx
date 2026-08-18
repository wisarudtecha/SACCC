import { IDBPDatabase, openDB } from "idb";

const DB_NAME = import.meta.env.VITE_DB_NAME || "CMS";
const KV_STORE = "KeyValueStore";
const DB_VERSION = 2; 

let dbInstance: IDBPDatabase | null = null;
const storeCache = new Map<string, any>();

export interface IndexConfig {
    name: string;
    keyPath: string | string[];
    unique?: boolean;
    multiEntry?: boolean;
}

export interface StoreConfig {
    primaryKey?: string | string[];
    autoIncrement?: boolean;
    indexes?: IndexConfig[];
}

export type Repository<T> = ReturnType<typeof createRepository<T>>;

export async function initDB(): Promise<IDBPDatabase> {
    if (dbInstance) return dbInstance;

    try {
        dbInstance = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(KV_STORE)) {
                    db.createObjectStore(KV_STORE);
                }

                if (!db.objectStoreNames.contains("caseList")) {
                    const caseStore = db.createObjectStore("caseList", { 
                        keyPath: "caseId" 
                    });
                    caseStore.createIndex("orgId", "orgId", { unique: false });
                    caseStore.createIndex("createdDate", "createdDate", { unique: false });
                }
            },
            blocked() {
                console.warn("IDB blocked: Please close other tabs.");
            },
            terminated() {
                dbInstance = null;
            }
        });
        return dbInstance;
    } catch (error) {
        console.error("IDB init error:", error);
        throw error;
    }
}

async function getDB(): Promise<IDBPDatabase> {
    if (dbInstance) return dbInstance;
    return await initDB();
}

function createRepository<T>(db: IDBPDatabase, storeName: string) {
    return {
        async add(data: T): Promise<IDBValidKey> {
            return await db.add(storeName, data);
        },
        async addBulk(items: T[]): Promise<IDBValidKey[]> {
            const tx = db.transaction(storeName, "readwrite");
            const promises = items.map((item) => tx.store.add(item));
            await tx.done;
            return Promise.all(promises);
        },
        async get(key: IDBValidKey): Promise<T | undefined> {
            return db.get(storeName, key);
        },
        async getAll(): Promise<T[]> {
            return db.getAll(storeName);
        },
        async getByIndex(indexName: string, value: IDBValidKey): Promise<T[]> {
            return db.getAllFromIndex(storeName, indexName, value);
        },
        async getOneByIndex(indexName: string, value: IDBValidKey): Promise<T | undefined> {
            return db.getFromIndex(storeName, indexName, value);
        },
        async update(data: T): Promise<IDBValidKey> {
            return db.put(storeName, data);
        },
        async updateBulk(items: T[]): Promise<IDBValidKey[]> {
            const tx = db.transaction(storeName, "readwrite");
            const promises = items.map((item) => tx.store.put(item));
            await tx.done;
            return Promise.all(promises);
        },
        async delete(key: IDBValidKey): Promise<void> {
            return db.delete(storeName, key);
        },
        async clear(): Promise<void> {
            return db.clear(storeName);
        },
        async count(): Promise<number> {
            return db.count(storeName);
        },
        async has(key: IDBValidKey): Promise<boolean> {
            const result = await db.getKey(storeName, key);
            return !!result;
        },
        getDB: () => db,
        getStoreName: () => storeName,
    };
}

export async function getStore<T>(storeName: string): Promise<Repository<T>> {
    if (storeCache.has(storeName)) return storeCache.get(storeName);
    
    const db = await getDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`Store ${storeName} not found`);
    }

    const repository = createRepository<T>(db, storeName);
    storeCache.set(storeName, repository);
    return repository;
}

export const idbStorage = {
    async setItem(key: string, value: any) {
        const db = await getDB();
        const storedValue = typeof value === "string" ? value : JSON.stringify(value);
        await db.put(KV_STORE, storedValue, key);
    },
    async getItem<T = any>(key: string): Promise<T | null> {
        const db = await getDB();
        const value = await db.get(KV_STORE, key);
        if (value === undefined) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value ?? null;
        }
    },
    async removeItem(key: string) {
        const db = await getDB();
        await db.delete(KV_STORE, key);
    },
    async clear() {
        const db = await getDB();
        await db.clear(KV_STORE);
    }
};

export async function setUpIndexDb() {
    await initDB();
}