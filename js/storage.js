export const STORAGE_KEYS = {
    USERS: "users",
    ATTENDANCE: "attendance",
    INCOME: "income",
    LAST_BACKUP: "lastBackup",
    AUTO_BACKUP_ENABLED: "autoBackupEnabled",
    GYM_SYSTEM_BACKUP: "gymSystemBackup"
};

export const Storage = {
    get(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error al cargar ${key} desde localStorage:`, error);
            return defaultValue;
        }
    },
    
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error al guardar ${key} en localStorage:`, error);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error al eliminar ${key} de localStorage:`, error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error("Error al limpiar localStorage:", error);
            return false;
        }
    }
};