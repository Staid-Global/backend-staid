import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Mailjet from 'node-mailjet';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class MailjetService {
  private mailjet;

  constructor() {
    this.mailjet = (Mailjet as any).apiConnect(
      process.env.MAILJET_API_KEY as string,
      process.env.MAILJET_API_SECRET as string,
    );
  }

  async sendMail(
    htmlContent: string,
    subject: string,
    recipientEmails: string[],
  ): Promise<void> {
    try {
      const request = this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_EMAIL,
              Name: process.env.MAILJET_SENDER_NAME || 'Staid Ltd',
            },
            To: recipientEmails.map((email) => ({
              Email: email,
            })),
            Subject: subject,
            HTMLPart: htmlContent,
          },
        ],
      });

      const result = await request;
      console.log('✅ Mailjet response:', result.body);
    } catch (error: any) {
      console.error('❌ Mailjet send error:', error);
      throw new HttpException(
        'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
