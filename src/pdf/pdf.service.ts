import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) { }

  async processAndSavePdf(userId: string, file: Express.Multer.File, title: string) {
    // 1. Extract text from the PDF buffer
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    const extractedText = result.text;
    await parser.destroy();

    // In a real app, fileUrl would be the URL from S3 or local storage after saving the file.
    // For this implementation, we'll store a placeholder or local path.
    const fileUrl = `/uploads/${file.originalname}`;

    // 2. Save metadata to the database
    const document = await this.prisma.document.create({
      data: {
        userId,
        title: title || file.originalname,
        fileUrl,
        extractedText,
      },
    });

    return document;
  }
}
