import { Injectable } from '@nestjs/common';
// import { CreateWebsocketDto } from './dto/create-websocket.dto';
// import { UpdateWebsocketDto } from './dto/update-websocket.dto';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface OnlineUser {
  deviceID: string;
  socketId: string;
  deviceName: string;
  platform: string;
}

@Injectable()
export class WebsocketService {
  private lgger = new Logger('WebsocketService');
  upOnline(data: any, client: Socket, onlineUsers: any) {
    onlineUsers.set(data.deviceID, {
      ...data,
      socketId: client.id,
    });
    const onlineList = Array.from(onlineUsers.values());
    client.broadcast.emit('online', onlineList);
    this.lgger.log('上线: ', data.deviceName);
    return onlineList;
  }

  downOnline(client: Socket, onlineUsers: any) {
    const user = Array.from(onlineUsers.values()).find(
      (item: any) => item.socketId === client.id,
    ) as OnlineUser;

    // 删除在线用户列表中的用户
    this.lgger.log('下线: ', user?.deviceName);
    if (user) {
      onlineUsers.delete(user.deviceID);
      client.broadcast.emit('online', Array.from(onlineUsers.values()));
    }

    return '下线';
  }

  // 向指定设备发送链接请求
  linkRequest(data: any, client: Socket) {
    client.to(data.to.socketId).emit('onLinkRequest', data.from);
  }

  // 接收方同意链接请求 后 向请求方发送加入房间通知
  emitJoninRoom(data: any, client: Socket) {
    this.joinRoom(data.roomId, client);
    client.to(data.to.socketId).emit('joinDesignatedRoom', {
      roomId: data.roomId,
      from: data.from,
    }); // 向请求发起方发送加入房间通知
    return {
      code: 200,
      msg: '加入房间成功',
    };
  }

  // 加入某个房间
  joinRoom(roomId: string, client: Socket) {
    client.join(roomId);
    console.log('加入房间:', roomId);
    return {
      code: 200,
      msg: '加入房间成功',
    };
  }

  // 退出某个房间
  leaveRoom(roomId: string, client: Socket) {
    client.leave(roomId);
    console.log('退出房间:', roomId);
    client.to(roomId).emit('onLeaveDesignatedRoom');
    return {
      code: 200,
      msg: '退出房间成功',
    };
  }

  // 接收方拒绝链接请求
  refuseLink(data: any, client: Socket) {
    client.to(data.to.socketId).emit('onRejectLink', data.from);
  }

  emitSendOffer(data: any, client: Socket) {
    console.log('emitSendOffer', data, client.id);

    const { roomId, from, initiateOffer } = data;

    client.to(roomId).emit('onSendOffer', { offer: initiateOffer, from });
  }

  // 接收方发送answer
  emitSendAnswer(data: any, client: Socket) {
    console.log('emitSendAnswer', data, client.id);

    const { roomId, from, answer } = data;

    client.to(roomId).emit('onSendAnswer', { answer, from });
  }

  emitSendIce(data: any, client: Socket) {
    console.log('emitSendIceCandidate', data, client.id);
    const { roomId, candidate } = data;
    client.to(roomId).emit('onSendIce', { candidate });
  }
}
