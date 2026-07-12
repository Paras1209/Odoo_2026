const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Maintenance = sequelize.define('Maintenance', {
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
  type: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 120]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  cost: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0,
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
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'scheduled'
  }
}, {
  timestamps: true,
  tableName: 'maintenance_records',
  indexes: [
    {
      fields: ['vehicleId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = Maintenance;