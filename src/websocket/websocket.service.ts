import { Injectable } from '@nestjs/common';
// import { CreateWebsocketDto } from './dto/create-websocket.dto';
// import { UpdateWebsocketDto } from './dto/update-websocket.dto';
import { Socket } from 'socket.io';

interface OnlineUser {
  deviceID: string;
  socketId: string;
  deviceName: string;
  platform: string;
}

@Injectable()
export class WebsocketService {
  upOnline(data: any, client: Socket, onlineUsers: any) {
    onlineUsers.set(data.deviceID, {
      ...data,
      socketId: client.id,
    });

    console.log('上线: ', onlineUsers);
    const onlineList = Array.from(onlineUsers.values());
    client.broadcast.emit('online', onlineList);
    return onlineList;
  }

  downOnline(client: Socket, onlineUsers: any) {
    console.log('下线');
    const user = Array.from(onlineUsers.values()).find(
      (item: any) => item.socketId === client.id,
    ) as OnlineUser;
    if (user) {
      onlineUsers.delete(user.deviceID);
      client.broadcast.emit('online', Array.from(onlineUsers.values()));
    }
    return '下线';
  }
}
