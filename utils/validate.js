const errors = require('./errors');
const format = require('./format');
const aws = require('../lib/aws-lib');
const Ajv = require('ajv');

/*  
  The essentials. 
    A validator should accept an event's body parameter (as supplied to a serverless function).
    A validator should then process that event's body in some way, to validate it.
    A validator should then do one of two things:
      1. If valid, return the original event's body.
      2. If invalid, throw an error.
    A validator should take care to throw a relevant error that an API user can understand.
*/

// Generate a validator to check for the presence of a parameter within an event's body.
const presence = (object, parameter) => {
  if (object.hasOwnProperty(parameter) && object[parameter]) {
    return object;
  } else {
    const errorTemplate = `The *${parameter}* parameter is missing.`;
    throw new errors.APIError("MISSING_PARAMETER", 400, object, errorTemplate);
  };
};

// Generate a validator to ensure a specific parameter within an event body is the correct size.
// Checks character count.
const exactLength = (object, parameter, limit) => {
  if (object[parameter].length == limit) {
    return object;
  } else {
    const errorTemplate = `The *${parameter}* parameter must be exactly ${limit} characters.`;
    throw new errors.APIError("MALFORMED_PARAMETER", 400, object, errorTemplate);
  };
};

// Generate a validator to ensure a specific parameter within an event body is long enough.
// Checks character count.
const minLength = (object, parameter, minLimit) => {
  if (object[parameter].length >= minLimit) {
    return object;
  } else {
    const errorTemplate = `The *${parameter}* parameter is under the minimum ${minLimit} characters.`;
    throw new errors.APIError("MALFORMED_PARAMETER", 400, object, errorTemplate);
  };
};

// Generate a validator to ensure a specific parameter within an event body is small enough.
// Checks character count.
const maxLength = (object, parameter, maxLimit) => {
  if (object[parameter].length <= maxLimit) {
    return object;
  } else {
    const errorTemplate = `The *${parameter}* parameter is over the maximum ${maxLimit} characters.`;
    throw new errors.APIError("MALFORMED_PARAMETER", 400, object, errorTemplate);
  };
};

// Just check to see if a field exists. 
// Not a validator, just a helper.
const exists = (object, parameter) => {
  return ((object.hasOwnProperty(parameter) && object[parameter]) ? true : false);
};


// Validate a given phone number within the event's body.
// Makes a call to an AWS Pinpoint instance to do the check.
// Note this costs money. Validating phone number for format, length beforehand is advised.
const phoneNumber = async (object, parameter) => {
  let params = {
    NumberValidateRequest: {
      IsoCountryCode: 'US',
      PhoneNumber: object[parameter]
    }
  };
  // Ask AWS Pinpoint to validate the phone number based upon above params.
  return aws.pinpoint.phoneNumberValidate(params).promise().then(data => {
    // Our own additional validator is here. We need to see if this phone number can receive texts.
    let phoneType = data.NumberValidateResponse.PhoneType;
    if (phoneType == "INVALID" || phoneType == "OTHER") {
      throw new errors.APIError("NUMBER_NO_SMS", 400, object, "The *phone* parameter is not a valid US phone number that can receive SMS messages.");
    } else {
      return object;
    };
  }).catch(error => {
    // We need to juggle different types of errors. Some might come from aws-sdk, others from us.
    if (error.code == 'BadRequestException') {
      // aws-sdk error. We need to intercept it and give it our own wording.
      console.log(error, error.stack);
      throw new errors.APIError("MALFORMED_PARAMETER", 400, object, "The *phone* parameter is not a valid US phone number.");
    } else if (error.code == 'APIError') {
      // This is our validation error from above. Just pass it through and throw it.
      throw error;
    } else {
      // Just in case, fall back on a generic error.
      console.log(error, error.stack);
      throw new errors.APIError("FATAL_ERROR", 500, object, "Internal Server Error.");
    }
  });
};

// Check to see if a phone number has opted out of receiving texts.
// Makes a call to an AWS SNS instance to do the check.
// Validating phone number for format, length beforehand is advised.
const optedOut = async (object, parameter) => {
  const params = {
    phoneNumber: object[parameter]
  };
  // Ask AWS SNS to check if the phone number is opted out.
  return aws.sns.checkIfPhoneNumberIsOptedOut(params).promise().then(data => {
    // Our own additional validator is here. We need to see if this phone number has opted out of receiving texts.
    if (data.isOptedOut) {
      throw new errors.APIError("NUMBER_OPTED_OUT", 400, object, "This phone number has opted out of sending text messages.");
    } else {
      return object;
    };
  }).catch(error => {
    // We need to juggle different types of errors. Some might come from aws-sdk, others from us.
    if (error.code == 'ValidationError') {
      // aws-sdk error. We need to intercept it and give it our own wording.
      console.log(error, error.stack);
      throw new errors.APIError("MALFORMED_PARAMETER", 400, object, "The *phone* parameter is not a valid US phone number.");
    } else if (error.code == 'APIError') {
      // This is our validation error from above. Just pass it through and throw it.
      throw error;
    } else {
      // Just in case, fall back on a generic error.
      console.log(error, error.stack);
      throw new errors.APIError("FATAL_ERROR", 500, object, "Internal Server Error.");
    }
  });
};

// For handling optional parameters.
const optional = (fn, object, parameter, ...rest) => {
  if (object[parameter]) {
    return fn(object, parameter, ...rest);
  } else {
    return object;
  };
};

// Validate a data set (object or array) against a JSON Schema.
// The schema should be a valid JSON Schema object.
// Pass errors into a given errorHandler function to return useful error messages.
const schema = (data, schema, errorHandler = null) => {
  const ajv = new Ajv({schemaId: 'auto'});
  ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
  const valid = ajv.validate(schema, data);

  // If there are errors...
  if (!valid) {
    console.log(ajv.errors);

    // First, let's format the general, easy-to-handle errors.
    let messages = ajv.errors.reduce((msgs, error) => {
      if (error.keyword == 'required') {
        msgs.push(`The request must include a ${error.params.missingProperty} property.`);
      }
      if (error.keyword == 'minLength') {
        msgs.push(`The ${error.dataPath} property must be at least ${error.params.limit} characters, minimum.`)
      }
      if (error.keyword == 'maxLength') {
        msgs.push(`The ${error.dataPath} property must be no longer than ${error.params.limit} characters, maximum.`)
      }
      return msgs;
    }, []);

    // If an errorHandler function is defined to handle more exotic errors, call it here.
    if (errorHandler) {
      messages.push(...errorHandler(ajv.errors));
    }

    // If the errorHandler function returned a specific error, then throw it.
    // Else just throw a generic validation error.
    if (messages.length) {
      throw new errors.APIError("VALIDATION_ERROR", 400, data, messages.join(' '));;
    } else {
      throw new errors.APIError("VALIDATION_ERROR", 400, data, "Please check input for errors.");
    }
  } else {
    // No errors here, so just pass through the data.
    return data;
  }
}



module.exports = {
  presence,
  exactLength,
  minLength,
  maxLength,
  phoneNumber,
  optedOut,
  optional,
  exists,
  schema
}