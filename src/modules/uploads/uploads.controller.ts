import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Req,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';

@Controller('upload')
export class UploadsController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const protoHeader = req.headers['x-forwarded-proto'];
    const protocol = Array.isArray(protoHeader)
      ? protoHeader[0]
      : protoHeader || req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/public/${file.filename}`;
    return {
      message: '图片上传成功',
      url: fileUrl,
    };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  uploadVideo(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const protoHeader = req.headers['x-forwarded-proto'];
    const protocol = Array.isArray(protoHeader)
      ? protoHeader[0]
      : protoHeader || req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/public/${file.filename}`;
    return {
      message: '视频上传成功',
      url: fileUrl,
    };
  }

  @Post('classified')
  @UseInterceptors(FileInterceptor('file'))
  uploadClassified(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    console.log('Received file:', file); // 检查文件是否正常
    console.log('Received type:', type); // 检查 type 是否正常

    const folder = type || 'others';
    const destination = `./public/${folder}`;

    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const newPath = path.join(destination, file.filename);
    fs.renameSync(file.path, newPath);

    const fileUrl = `/public/${folder}/${file.filename}`;
    return {
      message: '文件分类上传成功',
      info: {
        url: fileUrl,
        type: file.mimetype,
        size: file.size,
        name: file.filename,
      },
      filePath: folder,
    };
  }

  /**
   * 删除指定文件
   * @param filePath 文件路径
   */
  @Delete('deleteFile')
  deleteFile(@Body('filePath') filePath: string) {
    console.log('filePath: ', filePath);
    try {
      let path = filePath.replace('public', 'public');
      path = join(__dirname, '../../../', path);
      console.log('path: ', path);

      if (!fs.existsSync(path)) {
        return {
          message: '文件不存在',
        };
      }
      fs.unlinkSync(path);
      return {
        message: '文件删除成功',
      };
    } catch (error) {
      return {
        message: '文件删除失败',
        error,
      };
    }
  }
}
