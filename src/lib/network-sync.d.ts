/**
 * Network Sync Implementation - Concrete adapters for JSONIC
 * Implements WebSocket, HTTP polling, and P2P sync strategies
 */
import { SyncAdapter, SyncOptions, ChangeSet } from './sync-adapter';
/**
 * WebSocket sync adapter for real-time synchronization
 */
export declare class WebSocketSyncAdapter extends SyncAdapter {
    private ws?;
    private reconnectTimer?;
    private reconnectAttempts;
    private messageQueue;
    private heartbeatTimer?;
    protected receiveChanges(): Promise<ChangeSet[]>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected sendChanges(changes: ChangeSet[]): Promise<void>;
    protected pullChanges(): Promise<ChangeSet[]>;
    private handleMessage;
    private resolveConflict;
    private authenticate;
    private flushMessageQueue;
    private scheduleReconnect;
    private startHeartbeat;
    private stopHeartbeat;
    private emitEvent;
}
/**
 * HTTP polling sync adapter for fallback synchronization
 */
export declare class HTTPSyncAdapter extends SyncAdapter {
    private pollTimer?;
    private lastSyncTime;
    protected receiveChanges(): Promise<ChangeSet[]>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected sendChanges(changes: ChangeSet[]): Promise<void>;
    protected pullChanges(): Promise<ChangeSet[]>;
    private startPolling;
    private stopPolling;
    private getAuthHeaders;
    private resolveConflict;
    private emitEvent;
}
/**
 * WebRTC sync adapter for peer-to-peer synchronization
 */
export declare class WebRTCSyncAdapter extends SyncAdapter {
    private peers;
    private dataChannels;
    private signaling?;
    private localId;
    protected receiveChanges(): Promise<ChangeSet[]>;
    constructor(options: SyncOptions);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected sendChanges(changes: ChangeSet[]): Promise<void>;
    protected pullChanges(): Promise<ChangeSet[]>;
    private connectSignaling;
    private handleSignalingMessage;
    private connectToPeer;
    private handleOffer;
    private handleAnswer;
    private handleIceCandidate;
    private setupDataChannel;
    private generatePeerId;
    private emitEvent;
}
/**
 * Factory function to create appropriate sync adapter
 */
export declare function createSyncAdapter(options: SyncOptions): SyncAdapter;
//# sourceMappingURL=network-sync.d.ts.map