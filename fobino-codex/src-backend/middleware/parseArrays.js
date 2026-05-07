// Middleware to parse JSON string arrays in FormData
const parseArrays = (req, res, next) => {
  const arrayFields = ['keyFeatures', 'keywords', 'paymentMethods', 'currencies'];
  
  arrayFields.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        // If parsing fails, keep the original value
        console.log(`Failed to parse ${field} as JSON:`, error);
      }
    }
  });
  
  next();
};

module.exports = parseArrays;
