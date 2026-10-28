import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = (booking, user) =>
  new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(__dirname, '..', 'uploads', 'invoices');
      if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

      const outputPath = path.join(invoiceDir, `invoice_${booking._id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      doc.fillColor('#10b981').fontSize(22).text('EV-Go Rental System', 50, 50, { lineGap: 4 });
      doc.fillColor('#6b7280').fontSize(10).text('Sustainable Mobility, Simplified.', 50, 78);
      doc.fillColor('#1f2937').fontSize(12)
        .text(`Invoice: INV-${booking._id.toString().toUpperCase().slice(-6)}`, 400, 50, { align: 'right' })
        .text(`Date: ${new Date(booking.updatedAt || Date.now()).toLocaleDateString()}`, 400, 68, { align: 'right' });

      doc.moveTo(50, 105).lineTo(550, 105).strokeColor('#e5e7eb').stroke();

      doc.fillColor('#111827').fontSize(13).text('Billed To:', 50, 125);
      doc.fillColor('#4b5563').fontSize(10)
        .text(`Name: ${user.name}`, 50, 145, { lineGap: 3 })
        .text(`Email: ${user.email}`, 50, 160);

      doc.fillColor('#111827').fontSize(13).text('Rental Summary:', 300, 125);
      const vehicleName     = booking.vehicle?.modelName || 'EV Rental Car';
      const pickupStation   = booking.station?.name      || 'EV-Go Hub';
      const returnStnName   = booking.returnStation?.name || pickupStation;
      doc.fillColor('#4b5563').fontSize(10)
        .text(`EV Model: ${vehicleName}`,                            300, 145, { lineGap: 3 })
        .text(`Pickup: ${pickupStation}`,                            300, 160)
        .text(`Return: ${returnStnName}`,                            300, 175)
        .text(`Start: ${new Date(booking.startTime).toLocaleString()}`, 300, 190)
        .text(`End:   ${new Date(booking.endTime).toLocaleString()}`,   300, 205);

      doc.moveTo(50, 235).lineTo(550, 235).strokeColor('#e5e7eb').stroke();

      doc.fillColor('#111827').fontSize(11)
        .text('Item Description', 50, 255)
        .text('Amount (INR)', 450, 255, { align: 'right' });
      doc.moveTo(50, 272).lineTo(550, 272).strokeColor('#d1d5db').stroke();

      let y = 290;
      const baseFare = booking.totalCost - (booking.oneWayFee || 0);
      doc.fillColor('#4b5563')
        .text('EV Rental Base Charges', 50, y)
        .text(`₹${baseFare.toLocaleString('en-IN')}`, 450, y, { align: 'right' });

      if (booking.oneWayFee > 0) {
        y += 20;
        doc.text('One-Way Inter-Station Fee', 50, y)
          .text(`₹${booking.oneWayFee.toLocaleString('en-IN')}`, 450, y, { align: 'right' });
      }

      if (booking.securityDeposit?.amount > 0) {
        y += 20;
        doc.text('Security Deposit (Refundable)', 50, y)
          .text(`₹${booking.securityDeposit.amount.toLocaleString('en-IN')}`, 450, y, { align: 'right' });
      }

      y += 25;
      doc.moveTo(50, y).lineTo(550, y).strokeColor('#10b981').strokeWidth(1.5).stroke();
      y += 12;
      const grandTotal = booking.totalCost + (booking.securityDeposit?.amount || 0);
      doc.fillColor('#111827').fontSize(14)
        .text('Grand Total Paid', 50, y)
        .text(`₹${grandTotal.toLocaleString('en-IN')}`, 450, y, { align: 'right' });

      doc.fillColor('#9ca3af').fontSize(9)
        .text('Thank you for choosing EV-Go!', 50, 680, { align: 'center', lineGap: 3 })
        .text('For support, contact your pickup station.', 50, 695, { align: 'center' })
        .text('Electronically generated invoice — no physical signature required.', 50, 710, { align: 'center' });

      doc.end();
      writeStream.on('finish', () => { logger.info('Invoice generated', { path: outputPath }); resolve(outputPath); });
      writeStream.on('error', (err) => { logger.error('Invoice stream error', { message: err.message }); reject(err); });
    } catch (error) {
      logger.error('Invoice PDF generation failed', { message: error.message });
      reject(error);
    }
  });
