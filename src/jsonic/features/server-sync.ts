/**
 * JSONIC Server Sync Client
 * Real-time synchronization with JSONIC server
 * 
 * Based on the improved jsonic-server-client.ts from JSONIC v2
 */

export interface ServerConfig {
  // Simple config - just the URL
  url?: string;
  
  // Optional advanced config
  apiKey?: string;
  database?: string;
  
  // Sync behavior
  syncMode?: 'auto' | 'manual' | 'readonly';
  syncInterval?: number; // ms between syncs
  conflictStrategy?: 'last-write' | 'client-wins' | 'server-wins' | 'merge';
  
  // Performance
  batchSize?: number;
  compression?: boolean;
  cacheOffline?: boolean;
}

interface SyncState {
  connected: boolean;
  syncing: boolean;
  lastSync?: Date;
  pendingChanges: number;
  errors: Error[];
}

interface ChangeLog {
  id: string;
  collection: string;
  operation: 'insert' | 'update' | 'delete';
  document?: any;
  timestamp: number;
  synced: boolean;
  localVersion: number;
  serverVersion?: number;
}

/**
 * Server sync for JSONIC
 * Provides real-time bi-directional sync with conflict resolution
 */
export class ServerSync {
  private jsonic: any;
  private config: Required<ServerConfig>;
  private ws?: WebSocket;
  private syncState: SyncState;
  private changeLog: Map<string, ChangeLog> = new Map();
  private syncTimer?: number;
  private reconnectTimer?: number;
  private retryCount = 0;
  private maxRetries = 5;
  private requestCallbacks: Map<string, (response: any) => void> = new Map();
  // private requestId = 0; // Reserved for future use
  private listeners = new Set<(state: SyncState) => void>();

  constructor(config: ServerConfig = {}) {
    // Smart defaults
    this.config = {
      url: config.url || 'wss://jsonic1.immudb.io',
      apiKey: config.apiKey || '',
      database: config.database || 'default',
      syncMode: config.syncMode || 'auto',
      syncInterval: config.syncInterval || 5000,
      conflictStrategy: config.conflictStrategy || 'last-write',
      batchSize: config.batchSize || 100,
      compression: config.compression ?? true,
      cacheOffline: config.cacheOffline ?? true
    };

    this.syncState = {
      connected: false,
      syncing: false,
      pendingChanges: 0,
      errors: []
    };
  }

  /**
   * Initialize with JSONIC instance
   */
  async init(jsonic: any): Promise<void> {
    this.jsonic = jsonic;
    
    // Wrap JSONIC methods to track changes
    this.wrapJSONICMethods();
    
    // Auto-connect if configured
    if (this.config.url && this.config.syncMode !== 'manual') {
      await this.connect();
    }
  }

  /**
   * Get sync state for UI indicators
   */
  get state(): Readonly<SyncState> {
    return { ...this.syncState };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: SyncState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Connect to server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Convert HTTPS to WSS
        const wsUrl = this.config.url
          .replace('https://', 'wss://')
          .replace('http://', 'ws://');
        
        const fullUrl = `${wsUrl}/api/v1/ws`;
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
          console.log('[JSONIC Sync] Connected to server:', this.config.url);
          this.updateState({ connected: true });
          this.retryCount = 0;
          
          // Authenticate if needed
          if (this.config.apiKey) {
            this.authenticate();
          }
          
          // Start sync
          if (this.config.syncMode === 'auto') {
            this.startAutoSync();
          }
          
          // Sync pending changes
          this.syncPendingChanges();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('[JSONIC Sync] Server error:', error);
          this.syncState.errors.push(error as any);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[JSONIC Sync] Disconnected from server');
          this.updateState({ connected: false });
          this.stopAutoSync();
          
          // Auto-reconnect
          if (this.config.syncMode === 'auto' && this.retryCount < this.maxRetries) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    this.stopAutoSync();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    
    this.updateState({ connected: false });
  }

  /**
   * Authenticate with server
   */
  private authenticate(): void {
    this.sendMessage({
      type: 'auth',
      apiKey: this.config.apiKey,
      database: this.config.database
    });
  }

  /**
   * Handle server messages
   */
  private handleServerMessage(message: any): void {
    switch (message.type) {
      case 'sync':
        this.handleSyncUpdate(message.data);
        break;
        
      case 'response':
        const callback = this.requestCallbacks.get(message.id);
        if (callback) {
          callback(message.data);
          this.requestCallbacks.delete(message.id);
        }
        break;
        
      case 'error':
        console.error('[JSONIC Sync] Server error:', message.error);
        this.syncState.errors.push(new Error(message.error));
        break;
        
      case 'conflict':
        this.resolveConflict(message.data);
        break;
    }
  }

  /**
   * Handle sync updates from server
   */
  private handleSyncUpdate(data: any): void {
    // Apply server changes to local database
    if (!this.jsonic) return;
    
    const { operation, document } = data;
    
    // Apply change based on operation
    switch (operation) {
      case 'insert':
        // Check if not already exists locally
        if (!this.jsonic.find({ _id: document._id })) {
          this.jsonic.insertOne(document);
        }
        break;
        
      case 'update':
        this.jsonic.updateOne({ _id: document._id }, document);
        break;
        
      case 'delete':
        this.jsonic.deleteOne({ _id: document._id });
        break;
    }
    
    this.updateState({ lastSync: new Date() });
  }

  /**
   * Resolve conflicts based on strategy
   */
  private resolveConflict(conflict: any): void {
    const { local, server } = conflict;
    
    switch (this.config.conflictStrategy) {
      case 'last-write':
        // Use the document with latest timestamp
        if (local.timestamp > server.timestamp) {
          this.sendChange(local);
        } else {
          this.handleSyncUpdate(server);
        }
        break;
        
      case 'client-wins':
        this.sendChange(local);
        break;
        
      case 'server-wins':
        this.handleSyncUpdate(server);
        break;
        
      case 'merge':
        // Deep merge documents
        const merged = this.mergeDocuments(local, server);
        this.sendChange(merged);
        break;
    }
  }

  /**
   * Merge two documents
   */
  private mergeDocuments(local: any, server: any): any {
    // Simple merge strategy - combine properties
    return {
      ...server,
      ...local,
      _conflicts: [
        { source: 'local', timestamp: local.timestamp },
        { source: 'server', timestamp: server.timestamp }
      ]
    };
  }

  /**
   * Send message to server
   */
  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send change to server
   */
  private sendChange(change: ChangeLog): void {
    this.sendMessage({
      type: 'change',
      data: change
    });
  }

  /**
   * Sync pending changes
   */
  private async syncPendingChanges(): Promise<void> {
    if (this.syncState.syncing || !this.syncState.connected) return;
    
    this.updateState({ syncing: true });
    
    const pending = Array.from(this.changeLog.values())
      .filter(c => !c.synced)
      .slice(0, this.config.batchSize);
    
    for (const change of pending) {
      this.sendChange(change);
      change.synced = true;
    }
    
    this.updateState({ 
      syncing: false, 
      pendingChanges: this.changeLog.size - pending.length 
    });
  }

  /**
   * Wrap JSONIC methods to track changes
   */
  private wrapJSONICMethods(): void {
    if (!this.jsonic) return;
    
    const originalInsert = this.jsonic.insertOne?.bind(this.jsonic);
    const originalUpdate = this.jsonic.updateOne?.bind(this.jsonic);
    const originalDelete = this.jsonic.deleteOne?.bind(this.jsonic);
    
    if (originalInsert) {
      this.jsonic.insertOne = (doc: any) => {
        const result = originalInsert(doc);
        this.trackChange('insert', doc);
        return result;
      };
    }
    
    if (originalUpdate) {
      this.jsonic.updateOne = (filter: any, update: any) => {
        const result = originalUpdate(filter, update);
        this.trackChange('update', { filter, update });
        return result;
      };
    }
    
    if (originalDelete) {
      this.jsonic.deleteOne = (filter: any) => {
        const result = originalDelete(filter);
        this.trackChange('delete', { filter });
        return result;
      };
    }
  }

  /**
   * Track a change for sync
   */
  private trackChange(operation: ChangeLog['operation'], document: any): void {
    const change: ChangeLog = {
      id: `${Date.now()}-${Math.random()}`,
      collection: 'default',
      operation,
      document,
      timestamp: Date.now(),
      synced: false,
      localVersion: 1
    };
    
    this.changeLog.set(change.id, change);
    this.updateState({ pendingChanges: this.changeLog.size });
    
    // Auto-sync if connected
    if (this.config.syncMode === 'auto' && this.syncState.connected) {
      this.syncPendingChanges();
    }
  }

  /**
   * Start auto-sync timer
   */
  private startAutoSync(): void {
    this.stopAutoSync();
    
    this.syncTimer = window.setInterval(() => {
      this.syncPendingChanges();
    }, this.config.syncInterval);
  }

  /**
   * Stop auto-sync timer
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
    this.retryCount++;
    
    console.log(`[JSONIC Sync] Reconnecting in ${delay}ms...`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Update sync state and notify listeners
   */
  private updateState(partial: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...partial };
    this.listeners.forEach(listener => listener(this.syncState));
  }

  /**
   * Force sync now
   */
  async sync(): Promise<void> {
    await this.syncPendingChanges();
  }

  /**
   * Clear all pending changes
   */
  clearPending(): void {
    this.changeLog.clear();
    this.updateState({ pendingChanges: 0 });
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.syncState,
      changeLogSize: this.changeLog.size,
      retryCount: this.retryCount,
      config: this.config
    };
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.disconnect();
    this.changeLog.clear();
    this.requestCallbacks.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export default new ServerSync();