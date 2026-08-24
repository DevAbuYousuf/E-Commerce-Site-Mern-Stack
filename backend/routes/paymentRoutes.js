const express = require('express');

const {
  createPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN
} = require('../controllers/paymentController');

const router = express.Router();

// Initialize SSLCommerz payment
router.post('/create', createPayment);

// SSLCommerz callbacks
router.post('/success', paymentSuccess);
router.post('/fail', paymentFail);
router.post('/cancel', paymentCancel);
router.post('/ipn', paymentIPN);

module.exports = router;