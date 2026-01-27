import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { env } from '../../../config/env.js';

interface TransactionParams {
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface TransactionToken {
  txnToken: string;
  orderId: string;
  amount: number;
  mid: string;
}

interface TransactionStatus {
  orderId: string;
  txnId: string;
  status: 'TXN_SUCCESS' | 'TXN_FAILURE' | 'PENDING';
  amount: number;
  message: string;
}

const PAYTM_STAGING_HOST = 'securegw-stage.paytm.in';
const PAYTM_PROD_HOST = 'securegw.paytm.in';

function getHost(): string {
  return env.NODE_ENV === 'production' ? PAYTM_PROD_HOST : PAYTM_STAGING_HOST;
}

function generateChecksum(params: Record<string, string>, key: string): string {
  const data = Object.keys(params)
    .sort()
    .map(k => params[k])
    .join('|');
  
  return crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex');
}

export const paytmProvider = {
  async initiateTransaction(params: TransactionParams): Promise<TransactionToken> {
    const mid = env.PAYTM_MID;
    const mkey = env.PAYTM_MKEY;

    if (!mid || !mkey || env.NODE_ENV === 'development') {
      return this.mockInitiateTransaction(params);
    }

    const txnAmount = (params.amount / 100).toFixed(2);
    const orderId = params.orderId;

    const paytmParams: Record<string, string> = {
      MID: mid,
      ORDER_ID: orderId,
      TXN_AMOUNT: txnAmount,
      CUST_ID: params.customerId,
      CHANNEL_ID: 'WEB',
      WEBSITE: env.PAYTM_WEBSITE || 'DEFAULT',
      INDUSTRY_TYPE_ID: 'Retail',
      CALLBACK_URL: `${env.API_BASE_URL}/api/payments/paytm/callback`,
    };

    if (params.customerEmail) {
      paytmParams.EMAIL = params.customerEmail;
    }
    if (params.customerPhone) {
      paytmParams.MOBILE_NO = params.customerPhone;
    }

    const checksum = generateChecksum(paytmParams, mkey);

    const requestBody = {
      body: {
        requestType: 'Payment',
        mid: mid,
        websiteName: paytmParams.WEBSITE,
        orderId: orderId,
        callbackUrl: paytmParams.CALLBACK_URL,
        txnAmount: {
          value: txnAmount,
          currency: 'INR',
        },
        userInfo: {
          custId: params.customerId,
          email: params.customerEmail,
          mobile: params.customerPhone,
        },
      },
      head: {
        signature: checksum,
      },
    };

    const response = await fetch(
      `https://${getHost()}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json() as any;

    if (data.body?.resultInfo?.resultStatus !== 'S') {
      throw new Error(data.body?.resultInfo?.resultMsg || 'Failed to initiate Paytm transaction');
    }

    console.log(`[PAYTM] Transaction initiated: ${orderId}`);

    return {
      txnToken: data.body.txnToken,
      orderId: orderId,
      amount: params.amount,
      mid: mid,
    };
  },

  mockInitiateTransaction(params: TransactionParams): TransactionToken {
    console.log(`[MOCK PAYTM] Initiating transaction: ${params.orderId}, Amount: ₹${params.amount / 100}`);
    
    return {
      txnToken: 'mock_txn_' + nanoid(16),
      orderId: params.orderId,
      amount: params.amount,
      mid: 'MOCK_MID',
    };
  },

  async verifyTransaction(orderId: string): Promise<TransactionStatus> {
    const mid = env.PAYTM_MID;
    const mkey = env.PAYTM_MKEY;

    if (!mid || !mkey || env.NODE_ENV === 'development') {
      return this.mockVerifyTransaction(orderId);
    }

    const paytmParams: Record<string, string> = {
      MID: mid,
      ORDER_ID: orderId,
    };

    const checksum = generateChecksum(paytmParams, mkey);

    const requestBody = {
      body: {
        mid: mid,
        orderId: orderId,
      },
      head: {
        signature: checksum,
      },
    };

    const response = await fetch(
      `https://${getHost()}/v3/order/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json() as any;
    
    console.log(`[PAYTM] Transaction status for ${orderId}: ${data.body?.resultInfo?.resultStatus}`);

    return {
      orderId: orderId,
      txnId: data.body?.txnId || '',
      status: data.body?.resultInfo?.resultStatus === 'TXN_SUCCESS' ? 'TXN_SUCCESS' : 
              data.body?.resultInfo?.resultStatus === 'TXN_FAILURE' ? 'TXN_FAILURE' : 'PENDING',
      amount: parseFloat(data.body?.txnAmount || '0') * 100,
      message: data.body?.resultInfo?.resultMsg || '',
    };
  },

  mockVerifyTransaction(orderId: string): TransactionStatus {
    console.log(`[MOCK PAYTM] Verifying transaction: ${orderId} - AUTO SUCCESS`);
    
    return {
      orderId: orderId,
      txnId: 'mock_txn_' + nanoid(8),
      status: 'TXN_SUCCESS',
      amount: 0,
      message: 'Transaction successful (mock)',
    };
  },

  verifyCallbackChecksum(params: Record<string, string>, receivedChecksum: string): boolean {
    const mkey = env.PAYTM_MKEY;
    
    if (!mkey || env.NODE_ENV === 'development') {
      console.log('[MOCK PAYTM] Callback checksum verified (mock)');
      return true;
    }

    const calculatedChecksum = generateChecksum(params, mkey);
    return calculatedChecksum === receivedChecksum;
  },

  getConfig() {
    return {
      mid: env.PAYTM_MID || 'MOCK_MID',
      host: getHost(),
      isProduction: env.NODE_ENV === 'production',
    };
  },
};
