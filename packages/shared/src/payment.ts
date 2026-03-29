/** Supported payment rails in EthioTransit. */
export enum PaymentProvider {
  MPESA = "mpesa",
  CHAPA = "chapa",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum MpesaTransactionType {
  CUSTOMER_PAY_BILL_ONLINE = "CustomerPayBillOnline",
  CUSTOMER_BUY_GOODS_ONLINE = "CustomerBuyGoodsOnline",
}
