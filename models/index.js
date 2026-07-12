const User = require('./User');
const Role = require('./Role');

Role.hasMany(User, {
  as: 'users',
  foreignKey: 'roleId',
  sourceKey: 'id'
});

User.belongsTo(Role, {
  as: 'roleInfo',
  foreignKey: 'roleId',
  targetKey: 'id'
});

module.exports = {
  User,
  Role
};