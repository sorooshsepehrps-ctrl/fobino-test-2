class DropshippingSettlementService {
  calculateAmounts(rfp) {
    const grossAmount = Math.abs(
      rfp.payment?.amount ||
      rfp.paymentAmount ||
      rfp.totalAmount ||
      0
    );

    let feeAmount =
      typeof rfp.feeAmount === 'number'
        ? rfp.feeAmount
        : typeof rfp.fobinoFee === 'number'
        ? rfp.fobinoFee
        : 0;

    if (!feeAmount && grossAmount && rfp.product?.fobinoFeePercent) {
      feeAmount = Math.floor(grossAmount * (rfp.product.fobinoFeePercent / 100));
    }

    let providerNetAmount =
      typeof rfp.providerNetAmount === 'number'
        ? rfp.providerNetAmount
        : typeof rfp.providerAmount === 'number'
        ? rfp.providerAmount
        : grossAmount - feeAmount;

    if (providerNetAmount < 0) providerNetAmount = 0;

    return {
      grossAmount,
      feeAmount,
      providerNetAmount,
    };
  }
}

module.exports = new DropshippingSettlementService();