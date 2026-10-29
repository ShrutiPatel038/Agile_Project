import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a beautiful PDF invoice for a booking and saves it locally.
 * @param {object} booking - The Booking Mongoose document (must have vehicle populated)
 * @param {object} user - The User Mongoose document
 * @returns {Promise<string>} - Resolves with the absolute path of the generated invoice PDF
 */
export const generateInvoicePDF = (booking, user) => {
    return new Promise((resolve, reject) => {
        try {
            // Set up target directory in backend/uploads/invoices
            const invoiceDir = path.join(__dirname, '..', 'uploads', 'invoices');
            if (!fs.existsSync(invoiceDir)) {
                fs.mkdirSync(invoiceDir, { recursive: true });
            }

            const invoiceFilename = `invoice_${booking._id}.pdf`;
            const outputPath = path.join(invoiceDir, invoiceFilename);

            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(outputPath);

            doc.pipe(writeStream);

            // 1. Header (Emerald Green Palette)
            doc.fillColor('#10b981')
               .fontSize(22)
               .text('EVGo Rental System', 50, 50, { lineGap: 4 });

            doc.fillColor('#6b7280')
               .fontSize(10)
               .text('Sustainable Mobility, Simplified.', 50, 78);

            doc.fillColor('#1f2937')
               .fontSize(12)
               .text(`Invoice: INV-${booking._id.toString().toUpperCase().slice(-6)}`, 400, 50, { align: 'right' });
            doc.text(`Date: ${new Date(booking.updatedAt || Date.now()).toLocaleDateString()}`, 400, 68, { align: 'right' });

            // Horizontal line Divider
            doc.moveTo(50, 105)
               .lineTo(550, 105)
               .strokeColor('#e5e7eb')
               .stroke();

            // 2. Billing & Booking Columns
            doc.fillColor('#111827')
               .fontSize(13)
               .text('Billed To:', 50, 125);

            doc.fillColor('#4b5563')
               .fontSize(10)
               .text(`Name: ${user.name}`, 50, 145, { lineGap: 3 })
               .text(`Email: ${user.email}`, 50, 160);

            doc.fillColor('#111827')
               .fontSize(13)
               .text('Rental Summary:', 300, 125);

            const vehicleName = booking.vehicle?.modelName || 'EV Rental Car';
            const pickupStation = booking.station?.name || 'EVGo Hub';
            const returnStationName = booking.returnStation?.name || pickupStation;

            doc.fillColor('#4b5563')
               .fontSize(10)
               .text(`EV Model: ${vehicleName}`, 300, 145, { lineGap: 3 })
               .text(`Pickup: ${pickupStation}`, 300, 160)
               .text(`Return: ${returnStationName}`, 300, 175)
               .text(`Start: ${new Date(booking.startTime).toLocaleString()}`, 300, 190)
               .text(`End: ${new Date(booking.endTime).toLocaleString()}`, 300, 205);

            // Divider
            doc.moveTo(50, 235)
               .lineTo(550, 235)
               .strokeColor('#e5e7eb')
               .stroke();

            // 3. Pricing Items Table
            doc.fillColor('#111827')
               .fontSize(11)
               .text('Item Description', 50, 255)
               .text('Amount (INR)', 450, 255, { align: 'right' });

            doc.moveTo(50, 272)
               .lineTo(550, 272)
               .strokeColor('#d1d5db')
               .stroke();

            // Base Fare
            let y = 290;
            const baseFare = booking.totalCost - (booking.oneWayFee || 0);
            doc.fillColor('#4b5563')
               .text('EV Rental Base Rental Charges', 50, y)
               .text(`₹${baseFare.toLocaleString('en-IN')}`, 450, y, { align: 'right' });

            // One way inter-station fee
            if (booking.oneWayFee > 0) {
                y += 20;
                doc.text('One-Way Inter-Station Fee', 50, y)
                   .text(`₹${booking.oneWayFee.toLocaleString('en-IN')}`, 450, y, { align: 'right' });
            }

            // Security Deposit
            if (booking.securityDeposit?.amount > 0) {
                y += 20;
                doc.text('Security Deposit (Refundable on safe return)', 50, y)
                   .text(`₹${booking.securityDeposit.amount.toLocaleString('en-IN')}`, 450, y, { align: 'right' });
            }

            // Total divider
            y += 25;
            doc.moveTo(50, y)
               .lineTo(550, y)
               .strokeColor('#10b981')
               .strokeWidth(1.5)
               .stroke();

            // Grand Total
            y += 12;
            const grandTotal = booking.totalCost + (booking.securityDeposit?.amount || 0);
            doc.fillColor('#111827')
               .fontSize(14)
               .text('Grand Total Paid', 50, y)
               .text(`₹${grandTotal.toLocaleString('en-IN')}`, 450, y, { align: 'right' });

            // 4. Footer
            doc.fillColor('#9ca3af')
               .fontSize(9)
               .text('Thank you for choosing EVGo Rental System!', 50, 680, { align: 'center', lineGap: 3 })
               .text('For support or emergencies, please contact your pickup station.', 50, 695, { align: 'center' })
               .text('This is an electronically generated invoice and requires no physical signature.', 50, 710, { align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                console.log(`✅ Invoice generated at: ${outputPath}`);
                resolve(outputPath);
            });

            writeStream.on('error', (err) => {
                console.error('❌ Stream error during invoice PDF generation:', err);
                reject(err);
            });

        } catch (error) {
            console.error('❌ Failed to construct invoice PDF doc:', error);
            reject(error);
        }
    });
};
