const { Sequelize, QueryTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:');
async function test() {
  try {
    await sequelize.query('SELECT ?, ?, ?', {
      type: QueryTypes.SELECT,
      replacements: ['a', undefined, 'c']
    });
  } catch (e) {
    console.log(e.message);
  }
}
test();
