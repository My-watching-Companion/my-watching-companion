const sql = require("mssql");
const { USER, PASSWORD, SERVER, DATABASE } = require("./config");

const config = {
  user: USER,
  password: PASSWORD,
  server: SERVER,
  database: DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const executeQuery = async (query, params = []) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();

    params.forEach((param) => {
      if (!param.name || !param.type || param.value === undefined) {
        throw new Error(
          "Each parameter must have name, type and value properties"
        );
      }
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    throw error;
  }
};

module.exports = { executeQuery, sql };
