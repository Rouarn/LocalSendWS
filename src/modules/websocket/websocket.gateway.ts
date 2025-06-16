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
  introduction: string;
  createdAt: Date;
  updatedAt: Date;
}

interface privateChat {
  message: string;
  targetId: string;
  targetName: string;
  fromId: string;
  fromName: string;
  roomId: string;
  roomName: string;
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
      introduction: fakerZH_CN.book.title(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.onlineUsers.set(socket.id, user);
    this.websocketService.sendAllMessage(this.onlineUsers);

    // 可选：向公共房间发送欢迎消息
    this.server.to(this.PUBLIC_ROOM).emit('welcome_message', {
      id: new Date().getTime(),
      text: `新用户 ${user.socketName} 加入了聊天室`,
      socketName: '系统通知',
      senderId: 'System-Notification',
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
        id: new Date().getTime(),
        text: `用户 ${user.socketName} 离开了聊天室`,
        socketName: '系统通知',
        senderId: 'System-Notification',
        timestamp: new Date(),
      });
    }
  }

  // 私聊请求
  @SubscribeMessage('private_chat')
  async handlePrivateChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: privateChat,
  ) {
    this.websocketService.sendToUser(
      data.targetId,
      'listen:private_chat',
      data,
    );
    return this.websocketService.joinTheRoom(socket, data);
  }

  // 同意私聊邀请
  @SubscribeMessage('agree_private_chat')
  async handleAgreePrivateChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: privateChat,
  ) {
    this.websocketService.sendToUser(
      data.targetId,
      'listen:agree_private_chat',
      data,
    );
    return this.websocketService.joinTheRoom(socket, data);
  }

  // Message
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { message: string },
  ) {
    return this.websocketService.sendMessage(socket, data);
  }

  // 处理通话请求
  @SubscribeMessage('call-request')
  handleCallRequest(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: {
      roomId: string;
      isVideo: boolean;
      caller: string;
      callerId: string;
    },
  ) {
    // 转发给目标用户  (房间)
    this.websocketService.sendToUser(data.roomId, 'incoming-call', data);

    return { success: true };
  }

  // 处理offer转发
  @SubscribeMessage('rtc-offer')
  handleOffer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; senderId: string; description: any },
  ) {
    return this.websocketService.handleOffer(socket, data);
  }

  // 处理answer转发
  @SubscribeMessage('rtc-answer')
  handleAnswer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; senderId: string; description: any },
  ) {
    return this.websocketService.sendToRoom(data.roomId, 'listen:answer', data);
  }

  // 修正 handleIceCandidate 方法
  @SubscribeMessage('rtc-ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; senderId: string; candidate: any },
  ) {
    return this.websocketService.sendToRoom(
      data.roomId,
      'listen:iceCandidate',
      data,
    );
  }
}
