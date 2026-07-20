import { Controller, Get, Param, Res, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { PdfGeneratorService } from './pdf-generator.service';

@Controller('pdf-generator')
export class PdfGeneratorController {
  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {}

  @Get('download/:interactionId')
  @UseGuards(AuthGuard('jwt'))
  async downloadPdf(
    @Param('interactionId') interactionId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.sub;
    
    // Generate the PDF stream
    const pdfDoc = await this.pdfGeneratorService.generatePdf(interactionId, userId);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="study-report.pdf"');

    // Pipe the PDF document stream directly into the HTTP response
    pdfDoc.pipe(res);
    
    // End the PDF generation process
    pdfDoc.end();
  }
}
