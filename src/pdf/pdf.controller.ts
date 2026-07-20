import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PdfService } from './pdf.service';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('pdf')
@UseGuards(AuthGuard('jwt'))
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body('title') title: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Uploaded file is not a valid PDF');
    }

    const userId = req.user.sub; // Assuming JWT payload has 'sub' for user ID
    
    return this.pdfService.processAndSavePdf(userId, file, title);
  }
}
