const psql = require("../../database/connect/postgre");

const getOneResult = async (sql, params = []) => {
  return (await psql.query(sql, params)).rows[0] || null;
};

const getManyResults = async (sql, params = []) => {
  return (await psql.query(sql, params)).rows || null;
};

module.exports = {
  getOneResult,
  getManyResults,
};
