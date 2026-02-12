// import {  NextApiResponse } from 'next';
// import { NextRequest } from 'next/server';
// import Imap, { ImapMessage } from 'node-imap';
// import { ParsedMail, simpleParser } from 'mailparser';
// import util from 'util';

// type Email = {
//   subject: string;
//   from: string;
//   text: string;
// };

// export default function handler(req: NextRequest, res: NextApiResponse) {
//   const imap = new Imap({
//     user: process.env.EMAIL_USER as string,
//     password: process.env.EMAIL_PASS as string,
//     host: process.env.IMAP_HOST as string,
//     port: parseInt(process.env.IMAP_PORT as string, 10),
//     tls: true,
//   });

//   imap.once('ready', function () {
//     imap.openBox('INBOX', true, function (err, box) {
//       if (err) {
//         res.status(500).json({ error: 'Failed to open inbox' });
//         return;
//       }

//       imap.search(['UNSEEN', ['FROM', 'ayush.abhay.iameya.in']], function (err, results) {
//         if (err) {
//           res.status(500).json({ error: 'Failed to search emails' });
//           return;
//         }

//         if (!results || results.length === 0) {
//           res.status(200).json({ emails: [] });
//           imap.end();
//           return;
//         }

//         const f = imap.fetch(results, { bodies: '' });

//         const emails: Email[] = [];

//         f.on('message', function (msg: ImapMessage) {
//           let emailData = '';

//           msg.on('body', function (stream) {
//             stream.on('data', function (chunk: { toString: (arg0: string) => string; }) {
//               emailData += chunk.toString('utf8');
//             });
//           });

//           msg.once('end', async function () {
//             try {
//               const parsed = await simpleParser(emailData);
//               emails.push({
//                 subject: parsed.subject || 'No subject',
//                 from: parsed.from?.text || 'Unknown sender',
//                 text: parsed.text || 'No content',
//               });
//             } catch (error) {
//               console.error('Error parsing email:', error);
//             }
//           });
//         });

//         f.once('error', function (err) {
//           console.error('Fetch error:', err);
//           res.status(500).json({ error: 'Failed to fetch emails' });
//         });

//         f.once('end', function () {
//           imap.end();
//           res.status(200).json({ emails });
//         });
//       });
//     });
//   });

//   imap.once('error', function (err: { message: any; }) {
//     console.error('IMAP error:', err);
//     res.status(500).json({ error: err.message });
//   });

//   imap.once('end', function () {
//     console.log('IMAP connection ended');
//   });

//   imap.connect();
// }
