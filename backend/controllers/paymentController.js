import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr';
import QRCode from 'qrcode';

// Simulated in-memory store for development/testing when BAKONG_TOKEN is not set
const simulatedTransactions = new Set();

export const generateBakongKHQR = async (req, res) => {
  try {
    const {
      amount,
      currency = 'KHR',
      billNumber = `PY-${Date.now().toString().slice(-6)}`,
      storeLabel = 'Phum Yeung Restaurant'
    } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const bakongAccountID = process.env.BAKONG_ACCOUNT_ID || 'vatana@bkrt';
    const merchantName = process.env.BAKONG_MERCHANT_NAME || 'VUTH VATANA';
    const merchantCity = process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh';

    const isUSD = String(currency).toUpperCase() === 'USD';
    const currencyCode = isUSD ? khqrData.currency.usd : khqrData.currency.khr;

    // Amount should be integer for KHR, or 2 decimals for USD
    const formattedAmount = isUSD
      ? parseFloat(Number(amount).toFixed(2))
      : Math.round(Number(amount));

    const optionalData = {
      currency: currencyCode,
      amount: formattedAmount,
      expirationTimestamp: Date.now() + 15 * 60 * 1000, // 15 mins expiry
      billNumber: String(billNumber).slice(0, 25),
      storeLabel: String(storeLabel).slice(0, 25),
      terminalLabel: 'Cashier 01'
    };

    const individualInfo = new IndividualInfo(
      bakongAccountID,
      merchantName,
      merchantCity,
      optionalData
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(individualInfo);

    if (!result || result.status?.code !== 0 || !result.data?.qr) {
      return res.status(400).json({
        success: false,
        message: result?.status?.message || 'Failed to generate Bakong KHQR'
      });
    }

    const qrString = result.data.qr;
    const md5Hash = result.data.md5;

    // Generate high-res QR code base64 image data url
    const qrImage = await QRCode.toDataURL(qrString, {
      width: 320,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      data: {
        qr: qrString,
        md5: md5Hash,
        qrImage,
        amount: formattedAmount,
        currency: isUSD ? 'USD' : 'KHR',
        bakongAccountID,
        merchantName,
        billNumber
      }
    });
  } catch (error) {
    console.error('[Bakong KHQR Generate Error]', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

export const verifyTransactionByMD5 = async (req, res) => {
  try {
    const { md5 } = req.body;

    if (!md5) {
      return res.status(400).json({ success: false, message: 'MD5 hash is required' });
    }

    // Check if manually simulated in development
    if (simulatedTransactions.has(md5)) {
      return res.json({
        responseCode: 0,
        responseMessage: 'Success (Simulated)',
        data: {
          hash: md5,
          status: 'SUCCESS',
          paidAt: new Date().toISOString()
        }
      });
    }

    const DEFAULT_BAKONG_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiNWNhM2I0ZmQwMDMyNDY3YiJ9LCJpYXQiOjE3OTAwNjQ1NTQsImV4cCI6MTc5Nzg0MDU1NH0.yoIdI6hSVc-bY-tqcjvlTEl9BZRLKc-YBTayr15XPn8';
    const token = process.env.BAKONG_TOKEN || DEFAULT_BAKONG_TOKEN;
    const apiUrl = process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh/v1';

    console.log(`[Bakong Check] Checking MD5: ${md5} with Bakong API...`);

    // If real Bakong API token is provided, query NBC Bakong API
    if (token) {
      const response = await fetch(`${apiUrl}/check_transaction_by_md5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ md5 })
      });

      const data = await response.json().catch(() => ({}));
      console.log(`[Bakong Check Result] status: ${response.status}`, JSON.stringify(data));

      const isPaid =
        (data.responseCode === 0 && Boolean(data.data?.hash)) ||
        (data.status?.code === 0 && Boolean(data.data?.hash)) ||
        data.data?.status === 'SUCCESS' ||
        Boolean(data.hash);

      const isRateLimited = Boolean(
        data.errorCode === 17 ||
        data.errorCode === 1 ||
        (typeof data.responseMessage === 'string' &&
          (data.responseMessage.toLowerCase().includes('limit') ||
           data.responseMessage.toLowerCase().includes('exceeded')))
      );

      return res.json({
        success: isPaid,
        responseCode: data.responseCode ?? data.status?.code,
        responseMessage: data.responseMessage ?? data.status?.message,
        errorCode: data.errorCode,
        isPaid,
        isRateLimited,
        data: data.data
      });
    }

    // If no token is configured, return pending status
    res.json({
      success: false,
      responseCode: 1,
      responseMessage: 'Transaction could not be found (Awaiting payment or no BAKONG_TOKEN configured)',
      isPaid: false,
      data: null
    });
  } catch (error) {
    console.error('[Bakong Verify Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Simulation endpoint for local development/testing without real funds
export const simulatePaymentSuccess = (req, res) => {
  const { md5 } = req.body;
  if (md5) {
    simulatedTransactions.add(md5);
    return res.json({ success: true, message: `Simulated success for MD5: ${md5}` });
  }
  res.status(400).json({ success: false, message: 'MD5 is required' });
};
