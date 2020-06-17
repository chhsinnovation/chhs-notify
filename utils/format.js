const errors = require('./errors');

/*  
  The essentials. 
    A formatter should accept an object.
    A formatter should then process that object in some way, to format it.
    A formatter should then return the modified object, in full.
*/

// Parse the json.
const json = (object) => {
  try {
    return JSON.parse(object);
  } catch(e) {
    throw new errors.APIError(
      "INVALID_JSON", 400, object,
      "The submitted JSON is invalid. Please fix syntax and resubmit."
    );
  }
}

// Format a phone number.
const phoneNumber = (object, parameter) => {
  let phoneNumber = object[parameter];
  // If it's an integer, convert it to a string.
  if (Number.isInteger(phoneNumber)) { 
    phoneNumber = phoneNumber.toString(); 
  }
  // Remove everything but numbers.
  phoneNumber = phoneNumber.replace(/\D/g, "");
  // If there's no 1 at the front, add it to comply with E.164 for US numbers.
  if (phoneNumber.charAt(0) != "1" && phoneNumber.length == 10) { 
    phoneNumber = `1${phoneNumber}`; 
  }
  // Return the full object with modified phone number.
  object[parameter] = phoneNumber;
  return object;
};




module.exports = {
  json,
  phoneNumber
}