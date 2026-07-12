import api from './api';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: 'bus' | 'van' | 'truck' | 'car' | 'motorcycle' | 'trailer' | 'other';
  maxCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  createdAt: string;
  updatedAt: string;
}

const vehicleService = {
  getVehicles: async (status?: string): Promise<{ success: boolean; count: number; data: Vehicle[] }> => {
    const params = status ? { status } : {};
    const { data } = await api.get('/vehicles', { params });
    return data;
  },

  getVehicle: async (id: string): Promise<{ success: boolean; data: Vehicle }> => {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  },

  createVehicle: async (vehicle: Partial<Vehicle>): Promise<{ success: boolean; data: Vehicle }> => {
    const { data } = await api.post('/vehicles', vehicle);
    return data;
  },

  updateVehicle: async (
    id: string,
    vehicle: Partial<Vehicle>
  ): Promise<{ success: boolean; data: Vehicle }> => {
    const { data } = await api.put(`/vehicles/${id}`, vehicle);
    return data;
  },

  deleteVehicle: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete(`/vehicles/${id}`);
    return data;
  },
};

export default vehicleService;
