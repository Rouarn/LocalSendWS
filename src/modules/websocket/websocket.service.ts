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
  private currentRoom!: string;

  // 设置 WebSocket 服务器实例
  setServer(server: Server) {
    this.server = server;
  }

  setCurrentRoom(room: string) {
    this.currentRoom = room;
  }

  // 向所有在线用户发送消息
  broadcastToAll(event: string, message: any) {
    if (this.server) {
      this.server.emit(event, message);
    }
  }

  // 向特定用户发送消息
  sendToUser(socketId: string, event: string, message: any = '消息') {
    if (this.server) {
      this.server.to(socketId).emit(event, message);
    }
  }

  // 打印在线用户列表
  sendAllMessage(onlineUsers: Map<string, OnlineUser>) {
    const users = Array.from(onlineUsers.values());
    this.broadcastToAll('listen:onlineUsers', users); // 主动推送在线用户列表
  }

  //退出上一个房间 并加入新房间
  async joinTheRoom(socket: Socket, data: any) {
    await socket.leave(this.currentRoom);
    await socket.join(data.roomId);
    this.setCurrentRoom(data.roomId);

    return {
      roomId: data.roomId,
      socketId: socket.id,
    };
  }

  sendMessage(socket: Socket, data: any) {
    this.server.to(this.currentRoom).emit('listen:message', data);
    return { ...data, socketId: socket.id };
  }

  handleOffer(socket: Socket, data: any) {
    this.server.to(this.currentRoom).emit('listen:offer', data);
    return { ...data, socketId: socket.id };
  }

  handleAnswer(socket: Socket, data: any) {
    this.server.to(this.currentRoom).emit('listen:answer', data);
    return { ...data, socketId: socket.id };
  }
  handleIceCandidate(socket: Socket, data: any) {
    this.server.to(this.currentRoom).emit('listen:iceCandidate', data);
    return { ...data, socketId: socket.id };
  }
}
