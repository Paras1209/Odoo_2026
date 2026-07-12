const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database').sequelize;

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['status']
    },
    {
      fields: ['roleId']
    },
    {
      fields: ['passwordResetToken']
    }
  ],
  hooks: {
    beforeValidate: async (user) => {
      if (!user.roleId) {
        const Role = sequelize.models.Role;

        if (!Role) {
          throw new Error('Role model is not initialized');
        }

        const defaultRole = await Role.findOne({ where: { code: 'employee' } });

        if (!defaultRole) {
          throw new Error('Default employee role is missing');
        }

        user.roleId = defaultRole.id;
      }
    },
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to get public profile (without sensitive data)
User.prototype.getPublicProfile = function() {
  const role = this.roleInfo?.code ?? null;
  const { id, name, email, status, lastLoginAt, createdAt, updatedAt } = this;
  return { id, name, email, role, status, lastLoginAt, createdAt, updatedAt };
};

// Instance method to update last login
User.prototype.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  await this.save();
};

// Static method to find by email
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

// Static method to find by reset token
User.findByResetToken = async function(token) {
  return await this.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [Sequelize.Op.gt]: new Date()
      }
    }
  });
};

module.exports = User;