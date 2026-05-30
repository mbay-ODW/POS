import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private socket?: Socket;
  private newOrder$ = new Subject<{ _id: string }>();

  connect(): void {
    if (this.socket?.connected) return;
    // Connect to the Flask-SocketIO server (same host as REST API, no /api prefix)
    const wsUrl = environment.baseUrl.replace('/api/v1', '');
    this.socket = io(wsUrl, { transports: ['websocket', 'polling'] });
    this.socket.on('new_order', (data: { _id: string }) => {
      this.newOrder$.next(data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  onNewOrder(): Observable<{ _id: string }> {
    return this.newOrder$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
