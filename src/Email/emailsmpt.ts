import { BaseResponseTypeDTO, EmailAttachmentDTO } from "src/utils/utils.types";
import { HttpStatus } from "@nestjs/common";

const nodemailer = require('nodemailer');

  export const sendEmail = async (
    html: string,
    subject: string,
    recipientEmail: string,
    attachments?: EmailAttachmentDTO[],
  ): Promise<BaseResponseTypeDTO> => {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
          user: process.env.EMAIL_ADMIN,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const info = await transporter.sendMail({
        from: `"STAID" <${process.env.EMAIL_ADMIN}>`,
        to: recipientEmail,
        subject,
        html,
        attachments,
      });
  
      console.log(`✅ Email sent successfully: ${info.messageId}`);
  
      return {
        message: `Nodemailer sent message: ${info.messageId}`,
        code: HttpStatus.OK,
        success: true,
      };
    } catch (error) {
      console.error(`❌ Email sending failed:`, error);
  
      return {
        success: false,
        message: 'Email not sent',
        code: HttpStatus.BAD_GATEWAY,
      };
    }
  };
  
