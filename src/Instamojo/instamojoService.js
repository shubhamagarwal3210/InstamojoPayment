const { db } = require('../../firebase.js');
const util = require('util');
const cred = require("../../instamojoCred.json");
const Insta = require('instamojo-nodejs');
const configuration = require('../config/config.json');
const CONSTANT = require('./instamojoConstant.json');


/*
1: setting up the keys to connect to Instamojo
2: currently adding the test keys for instamojo account, need to be picked from some file for production
*/
Insta.setKeys(cred.API_KEY, cred.AUTH_KEY);

/*
1: isSandboxMode should be set to false when running in production
2: need to add a check for the environment to update isSandboxMode value
*/
Insta.isSandboxMode(true);

const createBilling = async (payload) => {
    try {
        var data = new Insta.PaymentData();
        data.currency = 'INR';
        data.send_sms = 'False';
        data.send_email = 'False';
        data.allow_repeated_payments = 'False';
        data.webhook = configuration.server + '/instamojo/webhook';
        data.redirect_url = configuration.dashboard;

        const paymentObj = Object.assign({}, data, payload);
        const createPaymentAsync = util.promisify(Insta.createPayment.bind(Insta));
        return createPaymentAsync(paymentObj);
    } catch (ex) {
        console.log(`Error in createBilling : ${ex} body : ${payload}`);
        return;
    }
}

const createBillingInDB = async (payload) => {
    try {
        /*
            1: Currently hardcoded the collection name, should be picked from a file
            2: Currently we have only one collection but in future can lead to errors
        */
        const docRef = db.collection('Payments').doc(payload.id);
        return await docRef.set(payload)
            .then(() => {
                console.log('Document added Successfully');
                return "Success";
            })
            .catch((error) => {
                console.error(`Error adding document: , ${error} with body : ${payload}`);
                return "Fail";
            });
    } catch (ex) {
        console.log(`Error in createBillingInDB : ${ex} body : ${payload}`);
        return "Fail";
    }
}

const updatePaymentStatusById = async (id, status) => {
    try {
        /*
            1: Currently hardcoded the collection name, should be picked from a file
            2: Currently we have only one collection but in future can lead to errors
        */
        const docRef = db.collection('Payments').doc(id);

        return await docRef.update({ 
            status: status, 
            modified_at: new Date(),
            endUserPaidFee : CONSTANT.IS_CONVNEIENCE_FEE_ON
        })
            .then(() => {
                console.log("Update succeeded.");
                return "Success";
            })
            .catch((error) => {
                console.error("Update failed: ", error);
                return "Fail";
            });
    } catch (ex) {
        console.log(`Error in updatePaymentStatusById : ${ex} body : ${id}`);
        return "Fail";
    }
}

const getAllInvoice = async () => {
    try {
        /*
            1: Currently hardcoded the collection name, should be picked from a file
            2: Currently we have only one collection but in future can lead to errors
        */
        const paymentsRef = db.collection('Payments');
        const docsSnap = await paymentsRef.get();
        docsSnap.forEach(doc => {
            console.log("Successfully retrieved Invoice", doc.data());
        })
        return docsSnap;
    } catch (ex) {
        console.log(`Error in getAllInvoice : ${ex}`);
        return "Fail";
    }

}

const getPaymentById = async id => {
    try {
        const contactRef = db.collection('Payments').doc(id)
        const doc = await contactRef.get()
        if (!doc.exists) {
            return "";
        }
        return doc;
    } catch (err) {
        return res.status(500).send(`${err}`)
    }

}

const isWebhookAmountValid = (amount, fees, webhookAmount) => {
    /*
        1: If CONVNEIENCE_FEE was turned off in the instamojo, then the user only paid the amount initiated
    */
    if(!CONSTANT.IS_CONVNEIENCE_FEE_ON) {
        return (+amount.stringValue) === (+webhookAmount);
    }
    
    /*
        1: If CONVNEIENCE_FEE was turned on in the instamojo, then the user only paid the amount initiated + CONVNEIENCE_FEE 
    */
    const gstAmount = percentage(CONSTANT.GST, fees);
    const expectedAmount = (+amount.stringValue) + (+fees) + (+gstAmount);
    /*
    1: Comparing the amount value with abs function since the value was not matching exactly
    2: There was some minor difference in value
    3: Its not fully suggested method but we can look for a way to improve this 
    */
    return Math.abs((+expectedAmount) - (+webhookAmount)) < 1;
}

const percentage = (partialValue, totalValue) => {
    return (partialValue * totalValue) / 100;
}

module.exports = {
    createBilling,
    createBillingInDB,
    updatePaymentStatusById,
    getAllInvoice,
    getPaymentById,
    isWebhookAmountValid,
};