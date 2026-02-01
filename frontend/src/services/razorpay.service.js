/**
 * Razorpay Payment Service
 * Handles Razorpay checkout integration
 */

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SAtcwAabOzkw5r';

// Load Razorpay script dynamically
let razorpayScriptLoaded = false;

const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
        if (razorpayScriptLoaded) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            razorpayScriptLoaded = true;
            resolve(true);
        };
        script.onerror = () => {
            reject(new Error('Failed to load Razorpay SDK'));
        };
        document.body.appendChild(script);
    });
};

const razorpayService = {
    /**
     * Initialize Razorpay payment
     * @param {Object} options - Payment options
     * @param {number} options.amount - Amount in paise (e.g., 44800 for ₹448)
     * @param {string} options.orderId - Your internal order ID
     * @param {string} options.razorpayOrderId - Razorpay order ID from backend
     * @param {string} options.customerName - Customer name
     * @param {string} options.customerEmail - Customer email
     * @param {string} options.customerPhone - Customer phone
     * @param {string} options.description - Payment description
     * @returns {Promise} Resolves with payment details on success
     */
    async openCheckout(options) {
        await loadRazorpayScript();

        return new Promise((resolve, reject) => {
            const razorpayOptions = {
                key: RAZORPAY_KEY_ID,
                amount: options.amount,
                currency: 'INR',
                name: 'QuickPrint',
                description: options.description || 'Print Order Payment',
                order_id: options.razorpayOrderId,
                prefill: {
                    name: options.customerName || '',
                    email: options.customerEmail || '',
                    contact: options.customerPhone || '',
                },
                theme: {
                    color: '#6366f1', // Indigo color matching the app
                },
                handler: function (response) {
                    // Payment successful
                    resolve({
                        success: true,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpaySignature: response.razorpay_signature,
                    });
                },
                modal: {
                    ondismiss: function () {
                        reject(new Error('Payment cancelled by user'));
                    },
                },
            };

            const razorpay = new window.Razorpay(razorpayOptions);
            razorpay.on('payment.failed', function (response) {
                reject(new Error(response.error.description || 'Payment failed'));
            });
            razorpay.open();
        });
    },

    /**
     * Create Razorpay order via backend
     * @param {string} orderId - Internal order ID
     * @returns {Promise<Object>} Razorpay order details
     */
    async createRazorpayOrder(orderId) {
        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/payments/initiate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    orderId,
                    provider: 'razorpay',
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create payment order');
        }

        return response.json();
    },

    /**
     * Verify payment with backend
     * @param {Object} paymentDetails - Payment details from Razorpay
     * @returns {Promise<Object>} Verification result
     */
    async verifyPayment(paymentDetails) {
        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/payments/verify`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(paymentDetails),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Payment verification failed');
        }

        return response.json();
    },
};

export default razorpayService;
