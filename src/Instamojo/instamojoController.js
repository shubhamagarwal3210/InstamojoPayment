const express = require('express');
const router = express.Router();
const instamojoService = require('./instamojoService');
const { ERROR } = require('./errors');
const instamojoValidation = require('./validation');

router.use(function (req, res, next) {
  console.log("In Instamojo Route");
  next();
})

/*
  1: Below endpoint is used to initiate the billing
  2: It calls Instamojo API, which billing payload which returns the billing url with other relevant information
  3: Once Instamojo returns success the billing information is saved in the Payments collection  
  4: while creating the bill please make sure the IS_CONVNEIENCE_FEE_ON value on instamojoConstant.json is same as the instamojo dashboard
*/
router.post('/billing',async (req, res) => {
  const { error } = instamojoValidation.billing.validate(req.body);
  if(error) {
    return res.status(403).send(error.details);
  }
  try {
    const paymentResponse = await instamojoService.createBilling(req.body)
    if (!paymentResponse) {
      console.log(`Error while creating the payment : ${paymentResponse}`);
      return res.send(ERROR.INSTAMOJO_BILLING_FAIL);
    }
    const paymentResponseObj = JSON.parse(paymentResponse);
    if (paymentResponseObj.success == false) {
      console.log(`Error while creating the payment with success as false : ${paymentResponseObj}`);
      return res.send(ERROR.INSTAMOJO_STATUS_FAIL);
    }
    const dbResponse = await instamojoService.createBillingInDB(paymentResponseObj.payment_request);
    if (dbResponse != "Success") {
      console.log(`Error while creating the payment, Db updation failed : ${dbResponse}`);
      return res.send(ERROR.UNABLE_TO_UPDATE_DB);
    }
    return res.send(paymentResponseObj.payment_request);

  } catch (ex) {
    console.log(`Error while billing : ${ex} body : ${req.body}`);
    return res.send(ERROR.INTERNAL_SERVER_ERROR)
  }
})

/*
  1: Below endpoint received the events from Instamojo
  2: Whenever someone tried to make payment a webhook is returned upon completion of payment either success/fail
  3: We update the status received from the webhook in the Payments collection  
  4: IS_CONVNEIENCE_FEE_ON in instamojoConstant.json should same as the value in instamojo dashboard 
*/
router.post('/webhook', async (req, res) => {
  try {
    if (req._body) {
      const payload = req.body;
      const paymentRequestID = payload.payment_request_id;
      const fees = payload.fees;
      const webhookAmount = payload.amount;
      let billDetails = await instamojoService.getPaymentById(paymentRequestID);
      if(!billDetails) {
        console.log(`Unable to fetch bill details for : ${payload}`);
        return res.send(ERROR.UNABLE_TO_FETCH_DATA_FROM_DB);
      }
      billDetails = billDetails._fieldsProto;
      const billAmount = billDetails.amount;

      /*
        1: isWebhookAmountValid, checks if the amount paid by the user matches with the amount raised in the bill
        2: this is to be sure that the amount was not manipulated while billing 
      */
      const isWebhookAmountValid = instamojoService.isWebhookAmountValid(billAmount, fees, webhookAmount);
      if(!isWebhookAmountValid) {
        console.log(`Billing amount didnt matched with webhook amount ${payload}`);
        return res.send(ERROR.UNEXPECTED_WEBHOOK_AMOUNT);
      }
      const status = payload.status;
      const dbResponse = await instamojoService.updatePaymentStatusById(paymentRequestID, status);
      if (dbResponse != "Success") {
        console.log(`Error while updating Status webhook in Payment collection ${dbResponse}`);
        return res.send(ERROR.UNABLE_TO_UPDATE_DB);
      }
      res.send(dbResponse);
    } else {
      console.log(`Req body missing in the webhook : ${req}`);
      return res.send(ERROR.WEBHOOK_REQ_BODY_NOT_FOUND);
    }
  } catch (ex) {
    console.log(`Error while Updating Status : ${ex} body : ${req.body}`);
    return res.send(ERROR.UNABLE_TO_UPDATE_DB);
  }

})

/*
1: Below API is used to get the array of all the invoices present in the Payments collection 
*/
router.get('/invoice', async (req, res) => {
  try {
    const dbResponse = await instamojoService.getAllInvoice();
    if(dbResponse == "Fail") {
      console.log(`Error while getting invoice info`);
      res.send(ERROR.UNABLE_TO_FETCH_DATA_FROM_DB);
    }
    res.send(dbResponse);
  } catch (ex) {
    console.log(`Error while getting invoice data : ${ex} :`);
    return res.send(ERROR.UNABLE_TO_FETCH_DATA_FROM_DB);
  }
})


module.exports = router;