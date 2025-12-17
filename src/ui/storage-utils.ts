/**
 * Storage Utilities for Figma Plugin
 * 
 * Uses figma.clientStorage via postMessage communication
 * since localStorage is disabled in Figma plugin iframes
 */

// ============================================
// TYPES
// ============================================

interface StorageRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

// ============================================
// STATE
// ============================================

const pendingRequests: Map<string, StorageRequest> = new Map();
let requestCounter = 0;

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRequestId(): string {
  return `storage-${Date.now()}-${++requestCounter}`;
}

function postMessage(type: string, payload: any): void {
  parent.postMessage({ pluginMessage: { type, payload } }, '*');
}

// ============================================
// STORAGE API
// ============================================

/**
 * Get a value from storage
 * @param key Storage key
 * @returns Promise that resolves with the stored value or null
 */
export async function storageGet<T = any>(key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    
    pendingRequests.set(requestId, { resolve, reject });
    
    // Set timeout for request
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`Storage get timeout for key: ${key}`));
      }
    }, 5000);
    
    postMessage('storage-get', { key, requestId });
  });
}

/**
 * Set a value in storage
 * @param key Storage key
 * @param data Value to store
 * @returns Promise that resolves when saved
 */
export async function storageSet(key: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    
    pendingRequests.set(requestId, { resolve, reject });
    
    // Set timeout for request
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`Storage set timeout for key: ${key}`));
      }
    }, 5000);
    
    postMessage('storage-set', { key, data, requestId });
  });
}

/**
 * Delete a value from storage
 * @param key Storage key
 * @returns Promise that resolves when deleted
 */
export async function storageDelete(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    
    pendingRequests.set(requestId, { resolve, reject });
    
    // Set timeout for request
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`Storage delete timeout for key: ${key}`));
      }
    }, 5000);
    
    postMessage('storage-delete', { key, requestId });
  });
}

/**
 * Get all storage keys
 * @returns Promise with array of keys
 */
export async function storageGetAllKeys(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    
    pendingRequests.set(requestId, { resolve, reject });
    
    // Set timeout for request
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Storage get all keys timeout'));
      }
    }, 5000);
    
    postMessage('storage-get-all-keys', { requestId });
  });
}

// ============================================
// MESSAGE HANDLER
// ============================================

/**
 * Handle storage response messages from plugin
 * Call this from the main message handler in ui.ts
 */
export function handleStorageMessage(msg: { type: string; payload: any }): boolean {
  switch (msg.type) {
    case 'storage-get-response': {
      const { requestId, data, success, error } = msg.payload;
      const request = pendingRequests.get(requestId);
      if (request) {
        pendingRequests.delete(requestId);
        if (success) {
          request.resolve(data);
        } else {
          request.reject(new Error(error || 'Storage get failed'));
        }
      }
      return true;
    }
    
    case 'storage-set-response': {
      const { requestId, success, error } = msg.payload;
      const request = pendingRequests.get(requestId);
      if (request) {
        pendingRequests.delete(requestId);
        if (success) {
          request.resolve(undefined);
        } else {
          request.reject(new Error(error || 'Storage set failed'));
        }
      }
      return true;
    }
    
    case 'storage-delete-response': {
      const { requestId, success, error } = msg.payload;
      const request = pendingRequests.get(requestId);
      if (request) {
        pendingRequests.delete(requestId);
        if (success) {
          request.resolve(undefined);
        } else {
          request.reject(new Error(error || 'Storage delete failed'));
        }
      }
      return true;
    }
    
    case 'storage-get-all-keys-response': {
      const { requestId, keys, success, error } = msg.payload;
      const request = pendingRequests.get(requestId);
      if (request) {
        pendingRequests.delete(requestId);
        if (success) {
          request.resolve(keys);
        } else {
          request.reject(new Error(error || 'Storage get keys failed'));
        }
      }
      return true;
    }
    
    default:
      return false;
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Save state object with key
 */
export async function saveStateToStorage<T>(key: string, state: T): Promise<void> {
  try {
    await storageSet(key, state);
    console.log(`[Storage] Saved: ${key}`);
  } catch (error) {
    console.error(`[Storage] Failed to save ${key}:`, error);
    throw error;
  }
}

/**
 * Load state object by key
 */
export async function loadStateFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const data = await storageGet<T>(key);
    if (data !== null && data !== undefined) {
      console.log(`[Storage] Loaded: ${key}`);
      return data;
    }
    return defaultValue;
  } catch (error) {
    console.warn(`[Storage] Failed to load ${key}, using default:`, error);
    return defaultValue;
  }
}

/**
 * Clear specific storage keys (for reset functionality)
 */
export async function clearStorageKeys(keys: string[]): Promise<void> {
  for (const key of keys) {
    try {
      await storageDelete(key);
      console.log(`[Storage] Deleted: ${key}`);
    } catch (error) {
      console.warn(`[Storage] Failed to delete ${key}:`, error);
    }
  }
}

// Storage keys used by the plugin
export const STORAGE_KEYS = {
  // Colors
  COLORS_STATE: 'colors-state',
  GENERATED_PALETTES: 'generated-palettes',
  
  // Typography
  TYPOGRAPHY_STATE: 'typography-state',
  TYPOGRAPHY_BREAKPOINTS: 'typography-breakpoints',
  
  // Spacing
  SPACING_STATE: 'spacing-state',
  
  // Gap
  GAP_STATE: 'gap-state',
  
  // Radius
  RADIUS_STATE: 'radius-state',
  
  // Icon Size
  ICON_SIZE_STATE: 'icon-size-state',
  
  // Token Manager
  TOKEN_MANAGER_STATE: 'token-manager-state',
  TOKEN_MANAGER_SETTINGS: 'token-manager-settings',
} as const;
