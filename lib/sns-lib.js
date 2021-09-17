const sns = require('./aws-lib').sns;

// Send an SMS message via SNS.
const publishSMS = (phoneNumber, message) => {
  const params = {
    Message: message,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional'
      }
    }
  };
  return sns.publish(params).promise().then(data => {
    return {
      sns_message_id: data.MessageId
    }
  });
};
 
module.exports.publishSMS = publishSMS;