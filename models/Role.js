const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
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
      fields: ['status']
    }
  ]
});

Role.prototype.hasPermission = function(permission) {
  return Array.isArray(this.permissions) && this.permissions.includes(permission);
};

Role.defaultRoles = [
  {
    code: 'employee',
    name: 'Employee',
    description: 'Default access for standard users',
    permissions: []
  },
  {
    code: 'admin',
    name: 'Administrator',
    description: 'Full access across the platform',
    permissions: ['*'],
    isSystem: true
  },
  {
    code: 'fleet_manager',
    name: 'Fleet Manager',
    description: 'Manages fleet assets and operational records',
    permissions: ['vehicles:read', 'vehicles:write', 'drivers:read', 'drivers:write', 'reports:read']
  },
  {
    code: 'driver',
    name: 'Driver',
    description: 'Can view own assignments and profile data',
    permissions: ['profile:read', 'assignments:read']
  },
  {
    code: 'safety_officer',
    name: 'Safety Officer',
    description: 'Oversees safety compliance and incidents',
    permissions: ['drivers:read', 'vehicles:read', 'incidents:read', 'incidents:write']
  },
  {
    code: 'financial_analyst',
    name: 'Financial Analyst',
    description: 'Reviews fleet financial and cost reporting',
    permissions: ['reports:read', 'finance:read']
  }
];

Role.seedDefaultRoles = async function() {
  for (const role of Role.defaultRoles) {
    await Role.findOrCreate({
      where: { code: role.code },
      defaults: role
    });
  }
};

module.exports = Role;