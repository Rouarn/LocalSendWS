import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public'), // 文件保存路径
        filename: (
          _: any,
          file: { originalname: string; mimetype: string },
          callback: (arg0: null, arg1: string) => void,
        ) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = file.originalname.split('.').pop(); // 获取文件扩展名
          const prefix = file.mimetype.split('/')[0] || 'file';
          callback(null, `${prefix}-${uniqueSuffix}.${ext}`);
        },
      }),
      fileFilter: (_, file, callback) => {
        // 如果为空，则拒绝上传
        if (!file.originalname) {
          callback(new Error('文件为空'), false); // 拒绝上传
        }
        // 控制上传类型
        if (
          ['image/jpeg', 'image/png', 'video/mp4', 'video/webm'].includes(
            file.mimetype,
          )
        ) {
          callback(null, true); // 允许上传
        } else {
          callback(new Error('文件类型不支持'), false); // 拒绝上传
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 限制文件大小为 10MB
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [],
})
export class UploadsModule {}
