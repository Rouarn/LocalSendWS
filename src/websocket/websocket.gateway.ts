import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { WebsocketService } from './websocket.service';
// import { CreateWebsocketDto } from './dto/create-websocket.dto';
// import { UpdateWebsocketDto } from './dto/update-websocket.dto';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common'; //打印库

@WebSocketGateway({
  cors: {
    origin: '*', // 允许跨域
  },
})
export class WebsocketGateway {
  private readonly logger = new Logger(WebsocketGateway.name);
  private onlineUsers: any = new Map();
  constructor(private readonly websocketService: WebsocketService) {}

  @SubscribeMessage('emitSendMessage')
  eceiveMessages(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    client.to(data.roomId).emit('onMessage', data.message);
    return {
      code: 200,
      msg: 'success',
    };
  }

  // 用户上线
  @SubscribeMessage('createWebsocket')
  upOnline(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.upOnline(data, client, this.onlineUsers);
  }

  // 当客户端断开连接时触发
  handleDisconnect(client: Socket) {
    return this.websocketService.downOnline(client, this.onlineUsers);
  }

  // 链接请求 (客户端发送)
  @SubscribeMessage('emitLinkRequest')
  linkRequest(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.linkRequest(data, client);
  }

  // 接收方同意 后 加入房间
  @SubscribeMessage('emitJoninRoom')
  emitJoninRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.emitJoninRoom(data, client);
  }

  // 加入房间
  @SubscribeMessage('joinRoom')
  joinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.joinRoom(data.roomId, client);
  }

  // 退出房间
  @SubscribeMessage('emitLeaveRoom')
  leaveRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.leaveRoom(data.roomId, client);
  }

  // 接收方拒绝链接
  @SubscribeMessage('emitCloseRequest')
  refuseLink(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.refuseLink(data, client);
  }

  // 接收  offer 信息
  @SubscribeMessage('emitSendOffer')
  emitSendOffer(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.emitSendOffer(data, client);
  }

  // 接收 answer 信息
  @SubscribeMessage('emitSendAnswer')
  emitSendAnswer(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.emitSendAnswer(data, client);
  }

  // 接收 ice 信息
  @SubscribeMessage('emitSendIce')
  emitSendIce(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.emitSendIce(data, client);
  }
}
