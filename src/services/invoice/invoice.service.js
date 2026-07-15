import PDFDocument from "pdfkit";

// Streams a PDF invoice directly to the response — no temp files on disk.
// Add a QR code (e.g. `qrcode` package rendered to a PNG buffer) before the
// "Thank you" block once you wire up a hosted order-tracking URL.
export const streamInvoicePdf = (order, res) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text("INVOICE", { align: "right" });
  doc.fontSize(10).fillColor("#666").text(`Order #${order.orderNumber}`, { align: "right" });
  doc.text(new Date(order.createdAt).toLocaleDateString(), { align: "right" });
  doc.moveDown(2);

  doc.fillColor("#000").fontSize(12).text("Bill To:");
  doc.fontSize(10).fillColor("#333");
  doc.text(order.shippingAddress?.fullName || "");
  doc.text(order.shippingAddress?.street || "");
  doc.text(`${order.shippingAddress?.city || ""} ${order.shippingAddress?.postalCode || ""}`);
  doc.text(order.shippingAddress?.phone || "");
  doc.moveDown(2);

  const tableTop = doc.y;
  doc.fontSize(10).fillColor("#000");
  doc.text("Item", 50, tableTop, { width: 220 });
  doc.text("Qty", 280, tableTop, { width: 50, align: "right" });
  doc.text("Price", 340, tableTop, { width: 80, align: "right" });
  doc.text("Subtotal", 430, tableTop, { width: 80, align: "right" });
  doc.moveTo(50, tableTop + 15).lineTo(510, tableTop + 15).strokeColor("#ddd").stroke();

  let y = tableTop + 22;
  doc.fillColor("#333");
  for (const item of order.items) {
    doc.text(item.title, 50, y, { width: 220 });
    doc.text(String(item.quantity), 280, y, { width: 50, align: "right" });
    doc.text(`৳${item.price.toLocaleString()}`, 340, y, { width: 80, align: "right" });
    doc.text(`৳${item.subtotal.toLocaleString()}`, 430, y, { width: 80, align: "right" });
    y += 20;
  }

  doc.moveTo(50, y + 5).lineTo(510, y + 5).strokeColor("#ddd").stroke();
  y += 15;

  const summaryLine = (label, value, bold = false) => {
    doc.fontSize(bold ? 11 : 10).fillColor("#000");
    doc.text(label, 340, y, { width: 100, align: "right" });
    doc.text(value, 430, y, { width: 80, align: "right" });
    y += bold ? 22 : 18;
  };

  summaryLine("Subtotal", `৳${order.subtotal.toLocaleString()}`);
  if (order.discount > 0) summaryLine("Discount", `-৳${order.discount.toLocaleString()}`);
  summaryLine("Shipping", `৳${order.shippingCost.toLocaleString()}`);
  summaryLine("Total", `৳${order.total.toLocaleString()}`, true);

  doc.moveDown(3);
  doc.fontSize(9).fillColor("#999").text("Thank you for your order.", 50, y + 20);

  doc.end();
};
