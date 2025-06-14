import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [WebsocketModule, UploadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
