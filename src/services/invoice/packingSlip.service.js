// backend/src/services/invoice/packingSlip.service.js
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Warehouse-facing slip: shipping address + item list only, NO pricing —
// distinct from invoice.service.js which is the customer-facing document
// with full price breakdown. Uses a QR code (order number) instead of a
// traditional linear barcode to avoid the `canvas` native dependency that
// most barcode libraries require, which is fragile to build on Windows.
export const streamPackingSlipPdf = async (order, res) => {
  const qrDataUrl = await QRCode.toDataURL(order.orderNumber, {
    margin: 1,
    width: 200,
  });
  const qrImage = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const doc = new PDFDocument({ margin: 40, size: "A6" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=packing-slip-${order.orderNumber}.pdf`
  );
  doc.pipe(res);

  doc.image(qrImage, doc.page.width - 110, 40, { width: 70 });

  doc.fontSize(16).fillColor("#000").text("PACKING SLIP", 40, 40);
  doc.fontSize(11).fillColor("#666").text(order.orderNumber, 40, 62);
  doc.text(new Date(order.createdAt).toLocaleDateString(), 40, 78);

  doc.moveDown(3);
  doc.fontSize(12).fillColor("#000").text("SHIP TO:", { underline: true });
  doc.fontSize(11).fillColor("#333");
  doc.text(order.shippingAddress?.fullName || "");
  doc.text(order.shippingAddress?.phone || "");
  doc.text(order.shippingAddress?.street || "");
  doc.text(
    `${order.shippingAddress?.city || ""} ${
      order.shippingAddress?.district || ""
    } ${order.shippingAddress?.postalCode || ""}`
  );

  doc.moveDown(1.5);
  doc.fontSize(12).fillColor("#000").text("ITEMS:", { underline: true });
  doc.moveDown(0.3);

  doc.fontSize(10).fillColor("#333");
  for (const item of order.items) {
    doc.text(`[ ] ${item.quantity} x  ${item.title}`, {
      width: doc.page.width - 80,
    });
    doc.moveDown(0.2);
  }

  doc.moveDown(1);
  doc
    .fontSize(9)
    .fillColor("#999")
    .text(
      `Payment: ${order.paymentMethod.toUpperCase()} ${
        order.paymentMethod === "cod"
          ? `— Collect ৳${order.total.toLocaleString()}`
          : "(prepaid)"
      }`
    );

  if (order.notes) {
    doc.moveDown(1);
    doc
      .fontSize(10)
      .fillColor("#000")
      .text("Note: ", { continued: true })
      .fillColor("#666")
      .text(order.notes);
  }

  doc.end();
};
