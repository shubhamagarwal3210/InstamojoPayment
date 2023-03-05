exports.ERROR = {
    INSTAMOJO_BILLING_FAIL: {
        status: 500,
        code: "INSTAMOJO_BILLING_FAIL",
        message: "Instamojo was unable to complete the billing",
    },
    INSTAMOJO_STATUS_FAIL: {
        status: 502,
        code: "INSTAMOJO_STATUS_FAIL",
        message: "Instamojo did not return the success response",
    },
    UNABLE_TO_UPDATE_DB: {
        status: 500,
        code: "UNABLE_TO_UPDATE_DB",
        message: "Error while updating information to DB",
    },
    INTERNAL_SERVER_ERROR: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
    },
    WEBHOOK_REQ_BODY_NOT_FOUND: {
        status: 200,
        code: "WEBHOOK_REQ_BODY_NOT_FOUND",
        message: "Req body was missing in the webhook",
    },
    UNABLE_TO_FETCH_DATA_FROM_DB: {
        status: 500,
        code: "UNABLE_TO_FETCH_DATA_FROM_DB",
        message: "Error while fetching data from DB",
    },
    UNEXPECTED_WEBHOOK_AMOUNT : {
        status: 400,
        code: "UNEXPECTED_WEBHOOK_AMOUNT",
        message: "The amount received in webhook didnt match the billing amount",
    }
};
