const sql = require("mssql")
const {USER, PASSWORD, SERVER, DATABASE} = require("./config")

const config = {
    user: USER, 
    password: PASSWORD, 
    server: SERVER,
    database: DATABASE,
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};

const executeQuery = async (query, params = []) => {
    try {
      
      const pool = await sql.connect(config);
      const request = pool.request();
  
      
      params.forEach((param, index) => {
        request.input(`param${index + 1}`, param); 
      });
  
      
      const result = await request.query(query);
      return result.recordset; 
    } catch (err) {
      throw err; 
    }
  };
  
  module.exports = { executeQuery };