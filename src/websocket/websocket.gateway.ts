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
  userName: string;
  ip: string;
  createdAt: Date;
  updatedAt: Date;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketGateway {
  private readonly logger = new Logger(WebsocketGateway.name);
  private onlineUsers = new Map<string, OnlineUser>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly websocketService: WebsocketService) {}

  afterInit() {
    this.websocketService.setServer(this.server);
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`新设备连接: ${socket.id}`);
    // console.log(socket);

    const user: OnlineUser = {
      socketId: socket.id,
      userName: fakerZH_CN.person.fullName() || '未命名用户',
      ip: socket.handshake.headers.origin || '未知 IP',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.onlineUsers.set(socket.id, user);
    this.websocketService.sendMessage(this.onlineUsers);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`设备断开连接: ${socket.id}`);
    this.onlineUsers.delete(socket.id);
    this.websocketService.sendMessage(this.onlineUsers);
  }

  @SubscribeMessage('joinTheRoom')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { username: string },
  ) {
    this.logger.log(`${data.username} is online`);
  }
}
