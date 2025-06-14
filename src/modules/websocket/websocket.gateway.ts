import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WebsocketService } from './websocket.service';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { fakerZH_CN } from '@faker-js/faker';

interface OnlineUser {
  socketId: string;
  socketName: string;
  ip: string;
  createdAt: Date;
  updatedAt: Date;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketGateway {
  private readonly logger = new Logger(WebsocketGateway.name);
  private onlineUsers = new Map<string, OnlineUser>();
  private readonly PUBLIC_ROOM = 'PUBLIC_ROOM'; // 定义公共房间名称

  @WebSocketServer()
  server!: Server;

  constructor(private readonly websocketService: WebsocketService) {}

  afterInit() {
    this.websocketService.setServer(this.server);
    this.websocketService.setCurrentRoom(this.PUBLIC_ROOM);
  }
  // 监听 设备连接
  async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`新设备连接: ${socket.id}`);

    // 加入公共房间
    await socket.join(this.PUBLIC_ROOM);
    this.logger.log(`用户 ${socket.id} 已加入公共房间`);

    const user: OnlineUser = {
      socketId: socket.id,
      socketName: fakerZH_CN.person.fullName() || '未命名用户',
      ip: socket.handshake.headers.origin || '未知 IP',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.onlineUsers.set(socket.id, user);
    this.websocketService.sendAllMessage(this.onlineUsers);

    // 可选：向公共房间发送欢迎消息
    this.server.to(this.PUBLIC_ROOM).emit('welcome_message', {
      message: `新用户 ${user.socketName} 加入了聊天室`,
      timestamp: new Date(),
    });
  }

  // 监听断开连接
  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`设备断开连接: ${socket.id}`);

    // 离开时不需要显式调用 leave，Socket.IO 会自动处理
    const user = this.onlineUsers.get(socket.id);
    this.onlineUsers.delete(socket.id);
    this.websocketService.sendAllMessage(this.onlineUsers);

    // 可选：通知公共房间有用户离开
    if (user) {
      this.server.to(this.PUBLIC_ROOM).emit('goodbye_message', {
        message: `用户 ${user.socketName} 离开了聊天室`,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('joinTheRoom')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { username: string },
  ) {
    this.logger.log(`${data.username} is online`);
  }

  @SubscribeMessage('private_chat')
  handlePrivateChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { message: string; to: string },
  ) {
    this.server.to(data.to).emit('private_chat', {
      message: data.message,
      from: socket.id,
    });

    return {
      message: data.message,
      from: socket.id,
    };
  }

  // Message
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { message: string; to: string },
  ) {
    return this.websocketService.sendMessage(socket, data);
  }
}
