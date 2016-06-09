module.exports = function() {
  return {
    couchdb: {
      host: (process.env.NODE_ENV === 'production') ? 'couchdb' : 'localhost',
      port: 5984
    }
  };
};
