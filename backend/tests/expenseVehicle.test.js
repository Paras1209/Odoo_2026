const Expense = require('../models/Expense');
const Maintenance = require('../models/Maintenance');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const {
  createExpense
} = require('../controllers/expenseController');
const {
  getVehicle
} = require('../controllers/vehicleController');

const createResponse = () => {
  const response = { status: jest.fn(), json: jest.fn() };
  response.status.mockReturnValue(response);
  return response;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('expense-to-trip linking', () => {
  it('creates a fuel expense linked to a trip on the same vehicle', async () => {
    const vehicle = { id: 'vehicle-1' };
    const trip = { id: 'trip-1', vehicleId: vehicle.id };
    const expense = { id: 'expense-1', vehicleId: vehicle.id, tripId: trip.id };
    const request = {
      body: {
        vehicleId: vehicle.id,
        tripId: trip.id,
        type: 'fuel',
        amount: '42.50',
        date: '2026-07-12',
        description: 'Diesel refill'
      }
    };
    const response = createResponse();

    jest.spyOn(Vehicle, 'findByPk').mockResolvedValue(vehicle);
    jest.spyOn(Trip, 'findByPk').mockResolvedValue(trip);
    jest.spyOn(Expense, 'create').mockResolvedValue(expense);

    await createExpense(request, response, jest.fn());

    expect(Expense.create).toHaveBeenCalledWith(expect.objectContaining({
      vehicleId: vehicle.id,
      tripId: trip.id,
      amount: 42.5
    }));
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ success: true, data: expense });
  });

  it('rejects a trip linked to another vehicle', async () => {
    const next = jest.fn();
    const response = createResponse();
    jest.spyOn(Vehicle, 'findByPk').mockResolvedValue({ id: 'vehicle-1' });
    jest.spyOn(Trip, 'findByPk').mockResolvedValue({ id: 'trip-1', vehicleId: 'vehicle-2' });
    jest.spyOn(Expense, 'create');
    const request = {
      body: {
        vehicleId: 'vehicle-1', tripId: 'trip-1', type: 'fuel', amount: 1,
        date: '2026-07-12', description: 'Fuel'
      }
    };

    await createExpense(request, response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Trip must belong to the selected vehicle', statusCode: 400
    }));
    expect(Expense.create).not.toHaveBeenCalled();
  });
});

describe('vehicle operational cost', () => {
  it('adds fuel expenses and completed maintenance costs', async () => {
    const vehicle = {
      id: 'vehicle-1', registrationNumber: 'AB-1234', name: 'City Van',
      get: jest.fn().mockReturnValue({ id: 'vehicle-1', name: 'City Van' })
    };
    const response = createResponse();

    jest.spyOn(Vehicle, 'findByPk').mockResolvedValue(vehicle);
    jest.spyOn(Expense, 'sum').mockResolvedValue('42.50');
    jest.spyOn(Maintenance, 'sum').mockResolvedValue('120.25');

    await getVehicle({ params: { id: vehicle.id } }, response, jest.fn());

    expect(Expense.sum).toHaveBeenCalledWith('amount', {
      where: { vehicleId: vehicle.id, type: 'fuel' }
    });
    expect(Maintenance.sum).toHaveBeenCalledWith('cost', {
      where: { vehicleId: vehicle.id, status: 'completed' }
    });
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        operationalCost: {
          fuelCost: 42.5,
          maintenanceCost: 120.25,
          operationalCost: 162.75
        }
      })
    });
  });
});
