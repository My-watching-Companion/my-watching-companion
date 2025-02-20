require("dotenv").config();

const USER = String(process.env.DB_USER);
const PASSWORD = String(process.env.DB_PASSWORD);
const SERVER = String(process.env.DB_SERVER);
const DATABASE = String(process.env.DB_DATABASE);
const CRYPTO_KEY = String(process.env.CRYPTO_KEY);
const TMDB_API_KEY = String(process.env.TMDB_API_KEY);

module.exports = { USER, PASSWORD, SERVER, DATABASE, CRYPTO_KEY, TMDB_API_KEY };