const aws = require('./aws-lib');
const errors = require('../utils/errors');
const validate = require('../utils/validate');

// A collection of validators, run one-by-one in sequence.
const validator = eventBody => {
  return Promise.resolve(eventBody)
    .then(body => validate.presence("phone")(body))
    .then(body => validate.minLength("phone", 11)(body))
    .then(body => validate.presence("message")(body))
    .then(body => validate.maxLength("message", 160)(body))
    .then(body => validate.phoneNumber(body))
    .catch(error => { throw error; });
};

// Send an SMS message based upon an event from AWS Lambda.
// Returns an array: [error, response]. 
const sendSMSMessage = async (event) => {
  try {
    // First parse the JSON within the event's body.
    // This is the JSON file that gets posted to our API.
    const eventBody = JSON.parse(event.body);

    // Next we need to run our validator to make sure the eventBody has what we need.
    // Note the `await` keyword here. We wait until the validator's promise is done, before we proceed.
    let valid = await validator(eventBody);

    // JSON is valid, charge up lasers.
    if (valid) {
      let params = {
        // process.env.PINPOINT_PROJECT_ID is an environment variable.
        // Environment variables are values set outside the code. This helps with config and secrecy.
        // See serverless.yml to see how this is set up for AWS Lambda.
        ApplicationId: process.env.PINPOINT_PROJECT_ID,
        MessageRequest: {
          Addresses: {
            [eventBody.phone]: {
              ChannelType: 'SMS'
            }
          },
          MessageConfiguration: {
            SMSMessage: {
              Body: eventBody.message,
              MessageType: 'TRANSACTIONAL',
              // OriginationNumber: originationNumber,
            }
          }
        }
      };
    
      // Ask AWS Pinpoint to send the text based on above params.
      let pinpointResponse = await aws.pinpoint.sendMessages(params).promise();

      // Build a successful response for delivery to the API client.
      const apiResponse = {
        status: "Message successfully scheduled for delivery.",
        input: eventBody,
        meta: pinpointResponse
      };

      // We got here without errors, so we return the error object as null, then pass in the response.
      return [null, apiResponse];
    }
  } catch (error) {
    // Something above went wrong, so we first log the error.
    console.log(error, error.stack);

    // Next we return with the error object, and response set as null because we never got that far.
    return [errors.respondWith(error), null];
  }
};

module.exports.sendSMSMessage = sendSMSMessage;