const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const {
  parseNumericValue,
  validateStringField,
  validateNumericField,
  validateEnumField,
  validateDateField,
  createUpdateValidator
} = require('../utils/validation');
const { EXPENSE_TYPES } = require('../constants');

const validateExpensePayload = (payload, isUpdate = false) => {
  const errors = [];
  const shouldValidate = createUpdateValidator(isUpdate, payload);

  if (shouldValidate('vehicleId')) {
    validateStringField(errors, payload.vehicleId, 'vehicleId', 1, 100, !isUpdate);
  }

  if (shouldValidate('tripId') && payload.tripId) {
    validateStringField(errors, payload.tripId, 'tripId', 1, 100, false);
  }

  if (shouldValidate('type') && payload.type) {
    validateEnumField(errors, payload.type, 'type', EXPENSE_TYPES);
  }

  if (shouldValidate('amount') && payload.amount !== undefined) {
    validateNumericField(errors, payload.amount, 'amount', 0);
  }

  if (shouldValidate('date') && payload.date) {
    validateDateField(errors, payload.date, 'date', !isUpdate);
  }

  if (shouldValidate('description')) {
    validateStringField(errors, payload.description, 'description', 1, 10000, !isUpdate);
  }

  if (shouldValidate('receiptUrl') && payload.receiptUrl) {
    validateStringField(errors, payload.receiptUrl, 'receiptUrl', 5, 500, false);
  }

  return errors;
};

const normalizeExpensePayload = (payload) => ({
  vehicleId: payload.vehicleId?.trim(),
  tripId: payload.tripId?.trim() || null,
  type: payload.type,
  amount: parseNumericValue(payload.amount),
  date: payload.date,
  description: payload.description?.trim(),
  receiptUrl: payload.receiptUrl?.trim() || null
});

const findTripForVehicle = async (tripId, vehicleId) => {
  if (!tripId) {
    return null;
  }

  const trip = await Trip.findByPk(tripId);

  if (!trip) {
    const error = new Error('Trip not found');
    error.statusCode = 404;
    throw error;
  }

  if (trip.vehicleId !== vehicleId) {
    const error = new Error('Trip must belong to the selected vehicle');
    error.statusCode = 400;
    throw error;
  }

  return trip;
};

const createExpense = asyncHandler(async (req, res) => {
  const errors = validateExpensePayload(req.body);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const vehicle = await Vehicle.findByPk(req.body.vehicleId);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  await findTripForVehicle(req.body.tripId?.trim(), vehicle.id);

  const expense = await Expense.create(normalizeExpensePayload(req.body));

  res.status(201).json({
    success: true,
    data: expense
  });
});

const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.findAll({ order: [['createdAt', 'DESC']] });

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses
  });
});

const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  res.status(200).json({
    success: true,
    data: expense
  });
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  const errors = validateExpensePayload(req.body, true);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const updateField = (fieldName, transform = (value) => value) => {
    if (req.body[fieldName] !== undefined) {
      expense[fieldName] = transform(req.body[fieldName]);
    }
  };

  if (req.body.vehicleId !== undefined) {
    const vehicle = await Vehicle.findByPk(req.body.vehicleId.trim());
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }
  }

  const targetVehicleId = req.body.vehicleId !== undefined
    ? req.body.vehicleId.trim()
    : expense.vehicleId;
  const targetTripId = req.body.tripId !== undefined
    ? req.body.tripId?.trim() || null
    : expense.tripId;

  await findTripForVehicle(targetTripId, targetVehicleId);

  updateField('vehicleId', (value) => value.trim());
  updateField('tripId', (value) => value?.trim() || null);
  updateField('type');
  updateField('amount', parseNumericValue);
  updateField('date');
  updateField('description', (value) => value.trim());
  updateField('receiptUrl', (value) => value?.trim() || null);

  const updatedExpense = await expense.save();

  res.status(200).json({
    success: true,
    data: updatedExpense
  });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByPk(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  await expense.destroy();

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

module.exports = {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  validateExpensePayload
};
