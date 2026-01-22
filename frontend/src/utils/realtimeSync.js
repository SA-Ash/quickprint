// Stubbed realtime sync - no socket connections
// All methods are no-ops since backend is disabled

class RealtimeSync {
  constructor() {
    this.listeners = new Set();
  }

  startRealtimeSync(userId, userRole = 'client', shopId = null) {
    // No-op - socket connections disabled
    console.log('RealtimeSync: Socket connections disabled (running in offline mode)');
  }

  setupSocketListeners() {
    // No-op
  }

  stopRealtimeSync() {
    // No-op
    this.listeners.clear();
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(eventType, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  async triggerRefresh() {
    // Just notify listeners without socket
    this.notifyListeners('manual_refresh');
  }
}

export const realtimeSync = new RealtimeSync();

export { RealtimeSync };
