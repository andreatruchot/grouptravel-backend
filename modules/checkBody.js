function checkBody(body, keys) {
    let isValid = true;
    console.log(body); 
  
    for (const field of keys) {
      if (!body[field] || body[field] === '') {
        isValid = false;
        console.log(`Field missing: ${field}`);
      }
    }
  
    return isValid;
  }
  
  module.exports = { checkBody };