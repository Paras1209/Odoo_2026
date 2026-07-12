const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50],
      is: /^[a-z_]+$/i
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'roles',
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Instance methods
Role.prototype.hasPermission = function(permission) {
  return this.permissions && this.permissions[permission] === true;
};

Role.prototype.grantPermission = function(permission) {
  if (!this.permissions) {
    this.permissions = {};
  }
  this.permissions[permission] = true;
};

Role.prototype.revokePermission = function(permission) {
  if (this.permissions && this.permissions[permission]) {
    delete this.permissions[permission];
  }
};

// Static methods
Role.findByCode = async function(code) {
  return await this.findOne({ where: { code, isActive: true } });
};

module.exports = Role;
