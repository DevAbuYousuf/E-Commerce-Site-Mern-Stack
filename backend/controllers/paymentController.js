const SSLCommerzPayment = require('sslcommerz-lts');

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';


// ===============================
// INITIATE PAYMENT
// ===============================
const createPayment = async (req, res) => {
  try {
    const {
      amount,
      name,
      email,
      phone,
      address,
      productName,
      transactionId
    } = req.body;

    if (!amount || !transactionId) {
      return res.status(400).json({
        message: 'Amount and transaction ID are required'
      });
    }

    const data = {
      total_amount: Number(amount),
      currency: 'BDT',

      tran_id: transactionId,

      success_url: `${process.env.BACKEND_URL}/api/payment/success`,
      fail_url: `${process.env.BACKEND_URL}/api/payment/fail`,
      cancel_url: `${process.env.BACKEND_URL}/api/payment/cancel`,
      ipn_url: `${process.env.BACKEND_URL}/api/payment/ipn`,

      shipping_method: 'Courier',

      product_name: productName || 'ShopNest Product',
      product_category: 'General',
      product_profile: 'general',

      cus_name: name,
      cus_email: email,
      cus_add1: address || 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: phone,

      ship_name: name,
      ship_add1: address || 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: '1000',
      ship_country: 'Bangladesh'
    };

    const sslcz = new SSLCommerzPayment(
      store_id,
      store_passwd,
      is_live
    );

    const apiResponse = await sslcz.init(data);

    if (!apiResponse || !apiResponse.GatewayPageURL) {
      return res.status(500).json({
        message: 'Failed to initialize SSLCommerz payment',
        response: apiResponse
      });
    }

    res.status(200).json({
      success: true,
      GatewayPageURL: apiResponse.GatewayPageURL,
      sessionkey: apiResponse.sessionkey
    });

  } catch (error) {
    console.error('SSLCommerz payment error:', error);

    res.status(500).json({
      message: error.message
    });
  }
};


// ===============================
// SUCCESS
// ===============================
const paymentSuccess = async (req, res) => {
  try {
    console.log('SSLCommerz SUCCESS:', req.body);

    const { val_id, tran_id } = req.body;

    if (!val_id || !tran_id) {
      return res.status(400).json({
        message: 'Invalid payment response'
      });
    }

    const sslcz = new SSLCommerzPayment(
      store_id,
      store_passwd,
      is_live
    );

    const validationResponse = await sslcz.validate({
      val_id
    });

    console.log('Validation response:', validationResponse);

    if (
      validationResponse.status === 'VALID' ||
      validationResponse.status === 'VALIDATED'
    ) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/success?tran_id=${tran_id}`
      );
    }

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed`
    );

  } catch (error) {
    console.error('Payment success error:', error);

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed`
    );
  }
};


// ===============================
// FAIL
// ===============================
const paymentFail = async (req, res) => {
  console.log('SSLCommerz FAILED:', req.body);

  return res.redirect(
    `${process.env.FRONTEND_URL}/payment/failed`
  );
};


// ===============================
// CANCEL
// ===============================
const paymentCancel = async (req, res) => {
  console.log('SSLCommerz CANCELLED:', req.body);

  return res.redirect(
    `${process.env.FRONTEND_URL}/payment/cancelled`
  );
};


// ===============================
// IPN
// ===============================
const paymentIPN = async (req, res) => {
  try {
    console.log('SSLCommerz IPN:', req.body);

    const { val_id, tran_id } = req.body;

    if (!val_id || !tran_id) {
      return res.status(400).json({
        message: 'Invalid IPN data'
      });
    }

    const sslcz = new SSLCommerzPayment(
      store_id,
      store_passwd,
      is_live
    );

    const validationResponse = await sslcz.validate({
      val_id
    });

    console.log(
      'IPN validation:',
      validationResponse
    );

    if (
      validationResponse.status === 'VALID' ||
      validationResponse.status === 'VALIDATED'
    ) {

      // TODO:
      // Find your order using tran_id
      // Verify amount
      // Update order status to "paid"

      console.log(
        `Payment validated successfully for transaction: ${tran_id}`
      );
    }

    return res.status(200).json({
      message: 'IPN received'
    });

  } catch (error) {
    console.error('IPN error:', error);

    return res.status(500).json({
      message: error.message
    });
  }
};


module.exports = {
  createPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN
};