import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

interface OnlineUser {
  socketId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WebsocketService {
  private server!: Server;

  // 设置 WebSocket 服务器实例
  setServer(server: Server) {
    this.server = server;
  }

  // 向所有在线用户发送消息
  broadcastToAll(event: string, message: any) {
    if (this.server) {
      this.server.emit(event, message);
    }
  }

  // 向特定用户发送消息
  sendToUser(socketId: string, event: string, message: any) {
    if (this.server) {
      this.server.to(socketId).emit(event, message);
    }
  }

  // 打印在线用户列表
  sendMessage(onlineUsers: Map<string, OnlineUser>) {
    const users = Array.from(onlineUsers.values());
    this.broadcastToAll('online_users', users); // 主动推送在线用户列表
  }
}
