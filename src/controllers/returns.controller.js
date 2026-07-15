import { asyncHandler } from "../utils/asyncHandler.js";
import * as returnsService from "../services/returns/returns.service.js";

export const createReturnRequest = asyncHandler(async (req, res) => {
  const returnRequest = await returnsService.createReturnRequest({
    orderId: req.body.orderId,
    customerId: req.user._id,
    items: req.body.items,
    reason: req.body.reason,
    images: req.body.images,
  });
  res.status(201).json({ success: true, data: returnRequest });
});

export const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await returnsService.getReturnsForCustomer(req.user._id);
  res.status(200).json({ success: true, data: returns });
});

export const getAllReturns = asyncHandler(async (req, res) => {
  const returns = await returnsService.getAllReturns(req.query);
  res.status(200).json({ success: true, data: returns });
});

export const updateReturnStatus = asyncHandler(async (req, res) => {
  const returnRequest = await returnsService.updateReturnStatus({
    returnId: req.params.id,
    status: req.body.status,
    note: req.body.note,
    refundAmount: req.body.refundAmount,
  });
  res.status(200).json({ success: true, data: returnRequest });
});
