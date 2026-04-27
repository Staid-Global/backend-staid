import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import * as Mailjet from 'node-mailjet';
import * as dotenv from 'dotenv';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Bunkernote } from 'src/bunkernote/entities/bunkernote.entity';
// import { Quotation } from 'src/quotation/entities/quotation.entity';
import { Waybill } from 'src/waybill/entities/waybill.entity';
import { Company } from 'src/company/entities/company.entity';
import { Quotation } from 'src/quotation/entities/quotation.entity';
dotenv.config();
const baseUrl = 'https://staid-redesigned.vercel.app/view';
// const baseUrl ='https://staidgloballtd.com/view'

@Injectable()
export class MailjetService {
  private mailjet;

  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Bunkernote.name)
    @InjectModel(Quotation.name)
    private readonly quotationModel: Model<Quotation>,
    @InjectModel(Waybill.name)
    private readonly waybillModel: Model<Waybill>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
    @InjectModel(Bunkernote.name)
    private readonly bunkernoteModel: Model<Bunkernote>,
  ) {
    this.mailjet = (Mailjet as any).apiConnect(
      process.env.MAILJET_API_KEY as string,
      process.env.MAILJET_API_SECRET as string,
    );
  }

  async sendMail(
    htmlContent: string,
    subject: string,
    recipientEmails: string[],
    attachments?: Array<{
      ContentType: string;
      Filename: string;
      Base64Content: string;
    }>,
  ): Promise<void> {
    try {
      if (
        !recipientEmails ||
        !Array.isArray(recipientEmails) ||
        recipientEmails.length === 0
      ) {
        throw new Error('No valid recipient emails provided');
      }
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
            ...(attachments?.length ? { Attachments: attachments } : {}),
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

//   async sendWaybillEmail(payload) {
//     let body = '';
//     const waybill = await this.waybillModel.findOne({
//       hashed_id: payload.hashedId,
//     });
//     const company = await this.companyModel.findById(waybill.company);
//     if (!company) {
//       throw new NotFoundException('Company not found');
//     }
//     if (waybill.category === 'rail-road-track') {
//       body = `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Staid Email Template</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             background-color: #f6f8fb;
//             margin: 0;
//             padding: 0;
//           }
//           .container {
//             background-color: #ffffff;
//             max-width: 600px;
//             margin: 40px auto;
//             border-radius: 10px;
//             box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//             overflow: hidden;
//           }
//           .logo {
//             font-weight: bold;
//             font-size: 1.5rem;
//           }
//           .header {
//             background-color: #251a66;
//             color: #ffffff;
//             text-align: center;
//             padding: 10px;
//           }
//           .content {
//             padding: 25px;
//             color: #333333;
//             line-height: 1.6;
//           }
//           .btn {
//             display: inline-block;
//             background-color: #251a66;
//             color: #ffffff !important;
//             padding: 10px 15px;
//             border-radius: 0.75rem;
//             text-decoration: none;
//             font-weight: 400;
//             margin-top: 15px;
//           }

//           .footer {
//             background-color: #f1f1f1;
//             text-align: center;
//             font-size: 13px;
//             color: #555555;
//             padding: 15px 10px;
//           }
//           .footer a {
//             color: #251a66;
//             text-decoration: none;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h2 class="logo">Rail-Road Track</h2>
//             <p>Track Logistics</p>
//           </div>

//           <div class="content">
//             <p>Dear ${company.name},</p>

//             <p>${payload.body}</p>

//             <p>Kindly click the button below to view your document securely.</p>

//             <p style="text-align: center">
//               <a href="${baseUrl}/waybill/${payload.hashedId}" class="btn">View Document</a>
//             </p>

//             <br />
//             <br />
//             <p>Best regards,</p>
//             <p>
//               <strong>Oluwole Olaleye</strong><br />
//               CEO, Rail Raod Track<br />
//               General Suppliers of Petroleum Products<br />
//               <a href="mailto:https://staidgloballtd.com"
//                 >support@railroadtrack.com</a
//               >
//               08181044690, 08034743098
//             </p>
//           </div>

//           <div class="footer">
//             <p>
//               Rail-Road Track © 2025 |
//               <a href="https://staidgloballtd.com">Visit our website</a>
//             </p>
//           </div>
//         </div>
//       </body>
//     </html>
//     s
//     `;
//     }

//     if (waybill.category === 'staid-global') {
//       body = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Staid Email Template</title>
//         <style>
//         body {
//         font-family: Arial, sans-serif;
//         background-color: #f6f8fb;
//         margin: 0;
//         padding: 0;
//         }
//         .container {
//         background-color: #ffffff;
//         max-width: 600px;
//         margin: 40px auto;
//         border-radius: 10px;
//         box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//         overflow: hidden;
//         }
//         .logo {
//         font-weight: bold;
//         font-size: 1.5rem;
//         }
//         .header {
//         background-color: #e66d0a;
//         color: #ffffff;
//         text-align: center;
//         padding: 10px;
//         }
//         .content {
//         padding: 25px;
//         color: #333333;
//         line-height: 1.6;
//         }
//         .btn {
//         display: inline-block;
//         background-color: #e66d0a;
//         color: #ffffff !important;
//         padding: 10px 15px;
//         border-radius: 0.75rem;
//         text-decoration: none;
//         font-weight: 400;
//         margin-top: 15px;
//         }
//         .footer {
//         background-color: #f1f1f1;
//         text-align: center;
//         font-size: 13px;
//         color: #555555;
//         padding: 15px 10px;
//         }
//         .footer a {
//         color: #e66d0a;
//         text-decoration: none;
//         }
//         </style>
//         </head>
//         <body>
//         <div class="container">
//         <div class="header">
//         <h2 class="logo">Staid Global Limited</h2>
//         <p>EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS</p>
//         </div>

//         <div class="content">
//         <p>Dear ${company.name},</p>

//         <p>${payload.body}</p>

//         <p>Kindly click the button below to view your document securely.</p>

//         <p style="text-align: center">
//           <a href="${baseUrl}/waybill/${payload.hashedId}" class="btn">View Document</a>
//         </p>

//         <br />
//         <br />
//         <p>Best regards,</p>
//         <p>
//           <strong>Oluwole Olaleye</strong><br />
//           CEO, Staid Global Limited<br />
//           EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS<br />
//           <a href="mailto:https://staidgloballtd.com"
//             >support@staidgloballtd.com</a
//           >
//           08181044690, 08034743098
//         </p>
//         </div>

//         <div class="footer">
//         <p>
//           Staid Global Limited © 2025 |
//           <a href="https://staidgloballtd.com">Visit our website</a>
//         </p>
//         </div>
//         </div>
//         </body>
//         </html>
//         s

//         `;
//     }

//     if (waybill.category === 'two-ventures') {
//       body = `
//     <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Staid Email Template</title>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         background-color: #f6f8fb;
//         margin: 0;
//         padding: 0;
//       }
//       .container {
//         background-color: #ffffff;
//         max-width: 600px;
//         margin: 40px auto;
//         border-radius: 10px;
//         box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//         overflow: hidden;
//       }
//       .logo {
//         font-weight: bold;
//         font-size: 2rem;
//       }
//       .header {
//         background-color: #a21c1c;
//         color: #ffffff;
//         text-align: center;
//         padding: 10px;
//       }
//       .content {
//         padding: 25px;
//         color: #333333;
//         line-height: 1.6;
//       }
//       .btn {
//         display: inline-block;
//         background-color: #a21c1c;
//         color: #ffffff !important;
//         padding: 10px 15px;
//         border-radius: 0.75rem;
//         text-decoration: none;
//         font-weight: 400;
//         margin-top: 15px;
//       }

//       .footer {
//         background-color: #f1f1f1;
//         text-align: center;
//         font-size: 13px;
//         color: #555555;
//         padding: 15px 10px;
//       }
//       .footer a {
//         color: #a21c1c;
//         text-decoration: none;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h2 class="logo">T.W.O Ventures</h2>
//         <p>General Suppliers of Petroleum Products</p>
//       </div>

//       <div class="content">
//       <p>Dear ${company.name},</p>

//       <p>${payload.body}</p>

//         <p>Kindly click the button below to view your document securely.</p>

//         <p style="text-align: center">
//           <a href="${baseUrl}/waybill/${payload.hashedId}" class="btn">View Document</a>
//         </p>

//         <br />
//         <br />
//         <p>Best regards,</p>
//         <p>
//           <strong>Oluwole Olaleye</strong><br />
//           CEO, 2ventures<br />
//           General Suppliers of Petroleum Products<br />
//           <a href="mailto:https://2ventures.com">support@2ventures.com</a>
//           08181044690, 08034743098
//         </p>
//       </div>

//       <div class="footer">
//         <p>
//           T.W.O Ventures © 2025 |
//           <a href="https://2ventures.com">Visit our website</a>
//         </p>
//       </div>
//     </div>
//   </body>
// </html>
//     `;
//     }

//     // ✅ ensure non-empty
//     if (!body.trim()) {
//       throw new Error(
//         `No email template found for category: ${waybill.category}`,
//       );
//     }
//     await this.sendMail(body, payload.subject, payload.email);
//   }

  async nothing1(){
  }

//   async sendQuotationEmail(payload) {
//     let body = '';
//     const quotation = await this.quotationModel
//       .findOne({ hashed_id: 'j7yrwphjeit7bywvonr6yi9jhbgdx9y9' })
//       .exec();

//     if (!quotation) {
//       throw new NotFoundException('quotation not found');
//     }
//     console.log('######################', quotation.company);
//     const comp = await this.companyModel.findById(quotation.company);
//     if (!comp) {
//       throw new NotFoundException('Company not found');
//     }

//     if (quotation.category === 'rail-road-track') {
//       body = `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Staid Email Template</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             background-color: #f6f8fb;
//             margin: 0;
//             padding: 0;
//           }
//           .container {
//             background-color: #ffffff;
//             max-width: 600px;
//             margin: 40px auto;
//             border-radius: 10px;
//             box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//             overflow: hidden;
//           }
//           .logo {
//             font-weight: bold;
//             font-size: 1.5rem;
//           }
//           .header {
//             background-color: #251a66;
//             color: #ffffff;
//             text-align: center;
//             padding: 10px;
//           }
//           .content {
//             padding: 25px;
//             color: #333333;
//             line-height: 1.6;
//           }
//           .btn {
//             display: inline-block;
//             background-color: #251a66;
//             color: #ffffff !important;
//             padding: 10px 15px;
//             border-radius: 0.75rem;
//             text-decoration: none;
//             font-weight: 400;
//             margin-top: 15px;
//           }

//           .footer {
//             background-color: #f1f1f1;
//             text-align: center;
//             font-size: 13px;
//             color: #555555;
//             padding: 15px 10px;
//           }
//           .footer a {
//             color: #251a66;
//             text-decoration: none;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h2 class="logo">Rail-Road Track</h2>
//             <p>Track Logistics</p>
//           </div>

//           <div class="content">
//             <p>Dear ${comp.name},</p>

//             <p>${payload.body}</p>

//             <p>Kindly click the button below to view your document securely.</p>

//             <p style="text-align: center">
//               <a href="${baseUrl}/quotation/${payload.hashedId}" class="btn">View Document</a>
//             </p>

//             <br />
//             <br />
//             <p>Best regards,</p>
//             <p>
//               <strong>Oluwole Olaleye</strong><br />
//               CEO, Rail Raod Track<br />
//               General Suppliers of Petroleum Products<br />
//               <a href="mailto:https://staidgloballtd.com"
//                 >support@railroadtrack.com</a
//               >
//               08181044690, 08034743098
//             </p>
//           </div>

//           <div class="footer">
//             <p>
//               Rail-Road Track © 2025 |
//               <a href="https://staidgloballtd.com">Visit our website</a>
//             </p>
//           </div>
//         </div>
//       </body>
//     </html>
//     s
//     `;
//     }

//     if (quotation.category === 'staid-global') {
//       body = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Staid Email Template</title>
//         <style>
//         body {
//         font-family: Arial, sans-serif;
//         background-color: #f6f8fb;
//         margin: 0;
//         padding: 0;
//         }
//         .container {
//         background-color: #ffffff;
//         max-width: 600px;
//         margin: 40px auto;
//         border-radius: 10px;
//         box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//         overflow: hidden;
//         }
//         .logo {
//         font-weight: bold;
//         font-size: 1.5rem;
//         }
//         .header {
//         background-color: #e66d0a;
//         color: #ffffff;
//         text-align: center;
//         padding: 10px;
//         }
//         .content {
//         padding: 25px;
//         color: #333333;
//         line-height: 1.6;
//         }
//         .btn {
//         display: inline-block;
//         background-color: #e66d0a;
//         color: #ffffff !important;
//         padding: 10px 15px;
//         border-radius: 0.75rem;
//         text-decoration: none;
//         font-weight: 400;
//         margin-top: 15px;
//         }
//         .footer {
//         background-color: #f1f1f1;
//         text-align: center;
//         font-size: 13px;
//         color: #555555;
//         padding: 15px 10px;
//         }
//         .footer a {
//         color: #e66d0a;
//         text-decoration: none;
//         }
//         </style>
//         </head>
//         <body>
//         <div class="container">
//         <div class="header">
//         <h2 class="logo">Staid Global Limited</h2>
//         <p>EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS</p>
//         </div>

//         <div class="content">
//         <p>Dear ${comp.name},</p>

//         <p>${payload.body}</p>

//         <p>Kindly click the button below to view your document securely.</p>

//         <p style="text-align: center">
//           <a href="${baseUrl}/quotation/${payload.hashedId}" class="btn">View Document</a>
//         </p>

//         <br />
//         <br />
//         <p>Best regards,</p>
//         <p>
//           <strong>Oluwole Olaleye</strong><br />
//           CEO, Staid Global Limited<br />
//           EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS<br />
//           <a href="mailto:https://staidgloballtd.com"
//             >support@staidgloballtd.com</a
//           >
//           08181044690, 08034743098
//         </p>
//         </div>

//         <div class="footer">
//         <p>
//           Staid Global Limited © 2025 |
//           <a href="https://staidgloballtd.com">Visit our website</a>
//         </p>
//         </div>
//         </div>
//         </body>
//         </html>
//         s

//         `;
//     }

//     if (quotation.category === 'two-ventures') {
//       body = `
//     <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Staid Email Template</title>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         background-color: #f6f8fb;
//         margin: 0;
//         padding: 0;
//       }
//       .container {
//         background-color: #ffffff;
//         max-width: 600px;
//         margin: 40px auto;
//         border-radius: 10px;
//         box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//         overflow: hidden;
//       }
//       .logo {
//         font-weight: bold;
//         font-size: 2rem;
//       }
//       .header {
//         background-color: #a21c1c;
//         color: #ffffff;
//         text-align: center;
//         padding: 10px;
//       }
//       .content {
//         padding: 25px;
//         color: #333333;
//         line-height: 1.6;
//       }
//       .btn {
//         display: inline-block;
//         background-color: #a21c1c;
//         color: #ffffff !important;
//         padding: 10px 15px;
//         border-radius: 0.75rem;
//         text-decoration: none;
//         font-weight: 400;
//         margin-top: 15px;
//       }

//       .footer {
//         background-color: #f1f1f1;
//         text-align: center;
//         font-size: 13px;
//         color: #555555;
//         padding: 15px 10px;
//       }
//       .footer a {
//         color: #a21c1c;
//         text-decoration: none;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h2 class="logo">T.W.O Ventures</h2>
//         <p>General Suppliers of Petroleum Products</p>
//       </div>

//       <div class="content">
//       <p>Dear ${comp.name},</p>

//       <p>${payload.body}</p>

//         <p>Kindly click the button below to view your document securely.</p>

//         <p style="text-align: center">
//           <a href="${baseUrl}/quotation/${payload.hashedId}" class="btn">View Document</a>
//         </p>

//         <br />
//         <br />
//         <p>Best regards,</p>
//         <p>
//           <strong>Oluwole Olaleye</strong><br />
//           CEO, 2ventures<br />
//           General Suppliers of Petroleum Products<br />
//           <a href="mailto:https://2ventures.com">support@2ventures.com</a>
//           08181044690, 08034743098
//         </p>
//       </div>

//       <div class="footer">
//         <p>
//           T.W.O Ventures © 2025 |
//           <a href="https://2ventures.com">Visit our website</a>
//         </p>
//       </div>
//     </div>
//   </body>
// </html>
// s

//     `;
//     }

//     // ✅ ensure non-empty
//     if (!body.trim()) {
//       throw new Error(
//         `No email template found for category: ${quotation.category}`,
//       );
//     }
//     await this.sendMail(body, payload.subject, payload.email);
//   }

  async nothing2(){

  }

//   async sendInvoiceEmail(payload) {
//     let body = '';
//     const invoice = await this.invoiceModel.findOne({
//       hashed_id: payload.hashedId,
//     });
//     const com = await this.companyModel.findById(invoice.company);
//     if (!com) {
//       throw new NotFoundException('Company not found');
//     }

//     if (invoice.category === 'rail-road-track') {
//       body = `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Staid Email Template</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             background-color: #f6f8fb;
//             margin: 0;
//             padding: 0;
//           }
//           .container {
//             background-color: #ffffff;
//             max-width: 600px;
//             margin: 40px auto;
//             border-radius: 10px;
//             box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//             overflow: hidden;
//           }
//           .logo {
//             font-weight: bold;
//             font-size: 1.5rem;
//           }
//           .header {
//             background-color: #251a66;
//             color: #ffffff;
//             text-align: center;
//             padding: 10px;
//           }
//           .content {
//             padding: 25px;
//             color: #333333;
//             line-height: 1.6;
//           }
//           .btn {
//             display: inline-block;
//             background-color: #251a66;
//             color: #ffffff !important;
//             padding: 10px 15px;
//             border-radius: 0.75rem;
//             text-decoration: none;
//             font-weight: 400;
//             margin-top: 15px;
//           }

//           .footer {
//             background-color: #f1f1f1;
//             text-align: center;
//             font-size: 13px;
//             color: #555555;
//             padding: 15px 10px;
//           }
//           .footer a {
//             color: #251a66;
//             text-decoration: none;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h2 class="logo">Rail-Road Track</h2>
//             <p>Track Logistics</p>
//           </div>

//           <div class="content">
//             <p>Dear ${com.name},</p>

//             <p>${payload.body}</p>

//             <p>Kindly click the button below to view your document securely.</p>

//             <p style="text-align: center">
//               <a href="${baseUrl}/invoice/${payload.hashedId}" class="btn">View Document</a>
//             </p>

//             <br />
//             <br />
//             <p>Best regards,</p>
//             <p>
//               <strong>Oluwole Olaleye</strong><br />
//               CEO, Rail Raod Track<br />
//               General Suppliers of Petroleum Products<br />
//               <a href="mailto:https://staidgloballtd.com"
//                 >support@railroadtrack.com</a
//               >
//               08181044690, 08034743098
//             </p>
//           </div>

//           <div class="footer">
//             <p>
//               Rail-Road Track © 2025 |
//               <a href="https://staidgloballtd.com">Visit our website</a>
//             </p>
//           </div>
//         </div>
//       </body>
//     </html>
//     s
//     `;
//     }

//     if (invoice.category === 'staid-global') {
//       body = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Staid Email Template</title>
//         <style>
//         body {
//         font-family: Arial, sans-serif;
//         background-color: #f6f8fb;
//         margin: 0;
//         padding: 0;
//         }
//         .container {
//         background-color: #ffffff;
//         max-width: 600px;
//         margin: 40px auto;
//         border-radius: 10px;
//         box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//         overflow: hidden;
//         }
//         .logo {
//         font-weight: bold;
//         font-size: 1.5rem;
//         }
//         .header {
//         background-color: #e66d0a;
//         color: #ffffff;
//         text-align: center;
//         padding: 10px;
//         }
//         .content {
//         padding: 25px;
//         color: #333333;
//         line-height: 1.6;
//         }
//         .btn {
//         display: inline-block;
//         background-color: #e66d0a;
//         color: #ffffff !important;
//         padding: 10px 15px;
//         border-radius: 0.75rem;
//         text-decoration: none;
//         font-weight: 400;
//         margin-top: 15px;
//         }
//         .footer {
//         background-color: #f1f1f1;
//         text-align: center;
//         font-size: 13px;
//         color: #555555;
//         padding: 15px 10px;
//         }
//         .footer a {
//         color: #e66d0a;
//         text-decoration: none;
//         }
//         </style>
//         </head>
//         <body>
//         <div class="container">
//         <div class="header">
//         <h2 class="logo">Staid Global Limited</h2>
//         <p>EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS</p>
//         </div>

//         <div class="content">
//         <p>Dear ${com.name},</p>

//         <p>${payload.body}</p>

//         <p>Kindly click the button below to view your document securely.</p>

//         <p style="text-align: center">
//           <a href="${baseUrl}/invoice/${payload.hashedId}" class="btn">View Document</a>
//         </p>

//         <br />
//         <br />
//         <p>Best regards,</p>
//         <p>
//           <strong>Oluwole Olaleye</strong><br />
//           CEO, Staid Global Limited<br />
//           EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS<br />
//           <a href="mailto:https://staidgloballtd.com"
//             >support@staidgloballtd.com</a
//           >
//           08181044690, 08034743098
//         </p>
//         </div>

//         <div class="footer">
//         <p>
//           Staid Global Limited © 2025 |
//           <a href="https://staidgloballtd.com">Visit our website</a>
//         </p>
//         </div>
//         </div>
//         </body>
//         </html>
//         s

//         `;
//     }

//     if (invoice.category === 'two-ventures') {
//       body = `
//     <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Staid Email Template</title>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         background-color: #f6f8fb;
//         margin: 0;
//         padding: 0;
//       }
//       .container {
//         background-color: #ffffff;
//         max-width: 600px;
//         margin: 40px auto;
//         border-radius: 10px;
//         box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
//         overflow: hidden;
//       }
//       .logo {
//         font-weight: bold;
//         font-size: 2rem;
//       }
//       .header {
//         background-color: #a21c1c;
//         color: #ffffff;
//         text-align: center;
//         padding: 10px;
//       }
//       .content {
//         padding: 25px;
//         color: #333333;
//         line-height: 1.6;
//       }
//       .btn {
//         display: inline-block;
//         background-color: #a21c1c;
//         color: #ffffff !important;
//         padding: 10px 15px;
//         border-radius: 0.75rem;
//         text-decoration: none;
//         font-weight: 400;
//         margin-top: 15px;
//       }

//       .footer {
//         background-color: #f1f1f1;
//         text-align: center;
//         font-size: 13px;
//         color: #555555;
//         padding: 15px 10px;
//       }
//       .footer a {
//         color: #a21c1c;
//         text-decoration: none;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h2 class="logo">T.W.O Ventures</h2>
//         <p>General Suppliers of Petroleum Products</p>
//       </div>

//       <div class="content">
//       <p>Dear ${com.name},</p>

//       <p>${payload.body}</p>

//         <p>Kindly click the button below to view your document securely.</p>

//         <p style="text-align: center">
//           <a href="${baseUrl}/invoice/${payload.hashedId}" class="btn">View Document</a>
//         </p>

//         <br />
//         <br />
//         <p>Best regards,</p>
//         <p>
//           <strong>Oluwole Olaleye</strong><br />
//           CEO, 2ventures<br />
//           General Suppliers of Petroleum Products<br />
//           <a href="mailto:https://2ventures.com">support@2ventures.com</a>
//           08181044690, 08034743098
//         </p>
//       </div>

//       <div class="footer">
//         <p>
//           T.W.O Ventures © 2025 |
//           <a href="https://2ventures.com">Visit our website</a>
//         </p>
//       </div>
//     </div>
//   </body>
// </html>
// s

//     `;
//     }

//     // ✅ ensure non-empty
//     if (!body.trim()) {
//       throw new Error(
//         `No email template found for category: ${invoice.category}`,
//       );
//     }
//     await this.sendMail(body, payload.subject, payload.email);
//   }
  async nothing3(){

  }

  
  // async sendBunkernoteEmail(payload) {
  //   const bunkernote = await this.bunkernoteModel.findOne({
  //     _id: payload.hashedId,
  //   });

  //   console.log('####################', bunkernote);
  //   const co = await this.companyModel.findById(bunkernote.seller);
  //   if (!co) {
  //     throw new NotFoundException('Company not found');
  //   }

  //   const body = `
  //       <!DOCTYPE html>
  //       <html>
  //       <head>
  //       <meta charset="UTF-8" />
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //       <title>Staid Email Template</title>
  //       <style>
  //       body {
  //       font-family: Arial, sans-serif;
  //       background-color: #f6f8fb;
  //       margin: 0;
  //       padding: 0;
  //       }
  //       .container {
  //       background-color: #ffffff;
  //       max-width: 600px;
  //       margin: 40px auto;
  //       border-radius: 10px;
  //       box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  //       overflow: hidden;
  //       }
  //       .logo {
  //       font-weight: bold;
  //       font-size: 1.5rem;
  //       }
  //       .header {
  //       background-color: #e66d0a;
  //       color: #ffffff;
  //       text-align: center;
  //       padding: 10px;
  //       }
  //       .content {
  //       padding: 25px;
  //       color: #333333;
  //       line-height: 1.6;
  //       }
  //       .btn {
  //       display: inline-block;
  //       background-color: #e66d0a;
  //       color: #ffffff !important;
  //       padding: 10px 15px;
  //       border-radius: 0.75rem;
  //       text-decoration: none;
  //       font-weight: 400;
  //       margin-top: 15px;
  //       }
  //       .footer {
  //       background-color: #f1f1f1;
  //       text-align: center;
  //       font-size: 13px;
  //       color: #555555;
  //       padding: 15px 10px;
  //       }
  //       .footer a {
  //       color: #e66d0a;
  //       text-decoration: none;
  //       }
  //       </style>
  //       </head>
  //       <body>
  //       <div class="container">
  //       <div class="header">
  //       <h2 class="logo">Staid Global Limited</h2>
  //       <p>EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS</p>
  //       </div>

  //       <div class="content">
  //       <p>Dear ${co.name},</p>

  //       <p>${payload.body}</p>

  //       <p>Kindly click the button below to view your document securely.</p>

  //       <p style="text-align: center">
  //         <a href="${baseUrl}/bunkernote/${payload.hashedId}" class="btn">View Document</a>
  //       </p>

  //       <br />
  //       <br />
  //       <p>Best regards,</p>
  //       <p>
  //         <strong>Oluwole Olaleye</strong><br />
  //         CEO, Staid Global Limited<br />
  //         EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS<br />
  //         <a href="mailto:https://staidgloballtd.com"
  //           >support@staidgloballtd.com</a
  //         >
  //         08181044690, 08034743098
  //       </p>
  //       </div>

  //       <div class="footer">
  //       <p>
  //         Staid Global Limited © 2025 |
  //         <a href="https://staidgloballtd.com">Visit our website</a>
  //       </p>
  //       </div>
  //       </div>
  //       </body>
  //       </html>
  //       s

  //       `;

  //   // ✅ ensure non-empty
  //   if (!body.trim()) {
  //     throw new Error(`No email template found for bunkernote`);
  //   }
  //   await this.sendMail(body, payload.subject, payload.email);
  // }
}
