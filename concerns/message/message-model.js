const sqs = require('../../lib/sqs-lib');





// Put a message into the intake queue for processing.
const queueIntake = (message) => {
  return sqs.queueMessage(process.env.SQS_MESSAGE_URL, message);
};

module.exports = {
  queueIntake
}