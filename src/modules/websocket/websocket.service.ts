import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

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

    return { success: true };
  }

  // 向特定用户发送消息
  sendToUser(socketId: string, event: string, message: any = '消息') {
    if (this.server) {
      this.server.to(socketId).emit(event, message);
    }

    return { success: true };
  }

  // 推送打印在线用户列表
  sendAllMessage(onlineUsers: Map<string, OnlineUser>) {
    const users = Array.from(onlineUsers.values());
    this.broadcastToAll('listen:onlineUsers', users);

    return { success: true };
  }

  // 向特定房间发送消息
  sendToRoom(room: string, event: string, message: any) {
    if (this.server) {
      this.server.to(room).emit(event, message);
    }
    return { success: true };
  }

  //退出上一个房间 并加入新房间
  async joinTheRoom(socket: Socket, data: any) {
    await socket.leave(data.roomCurId);
    await socket.join(data.roomId);

    return { success: true };
  }

  sendMessage(socket: Socket, data: any) {
    return this.sendToRoom(data.roomId, 'listen:message', data);
  }

  handleOffer(socket: Socket, data: any) {
    return this.sendToRoom(data.roomId, 'listen:offer', data);
  }

  handleAnswer(socket: Socket, data: any) {
    return this.sendToRoom(data.roomId, 'listen:answer', data);
  }
  handleIceCandidate(socket: Socket, data: any) {
    return this.sendToRoom(data.roomId, 'listen:iceCandidate', data);
  }
}
