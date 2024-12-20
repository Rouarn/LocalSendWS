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

  @SubscribeMessage('Message')
  eceiveMessages(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): string {
    this.logger.log('data: ', data);
    this.logger.log('clientId: ', client.id);
    client.emit('Message', '服务端发回的消息');
    return 'Hello world';
  }

  // 用户上线
  @SubscribeMessage('createWebsocket')
  upOnline(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return this.websocketService.upOnline(data, client, this.onlineUsers);
  }

  // 当客户端断开连接时触发
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    return this.websocketService.downOnline(client, this.onlineUsers);
  }
}
