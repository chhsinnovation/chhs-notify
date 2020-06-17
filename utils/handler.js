const errors = require('./errors');

const handler = (fn) => {
  return (event, context) => {
    return Promise.resolve()
      .then(() => fn(event, context))
      .catch((error) => {
        console.log(error, error.stack);
        return errors.respondWith(error);
      });
  };
};

module.exports = handler;