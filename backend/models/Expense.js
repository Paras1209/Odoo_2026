const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  tripId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'trips',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('fuel', 'toll', 'maintenance', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  receiptUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'expenses',
  indexes: [
    {
      fields: ['vehicleId']
    },
    {
      fields: ['tripId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = Expense;