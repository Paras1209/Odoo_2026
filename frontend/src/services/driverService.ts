import api from './api';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: 'A' | 'A1' | 'A2' | 'B' | 'B1' | 'C' | 'C1' | 'D' | 'D1' | 'E' | 'F' | 'G' | 'H' | 'other';
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: 'Available' | 'On Trip' | 'Suspended';
  createdAt: string;
  updatedAt: string;
}

const driverService = {
  getDrivers: async (status?: string): Promise<{ success: boolean; count: number; data: Driver[] }> => {
    const params = status ? { status } : {};
    const { data } = await api.get('/drivers', { params });
    return data;
  },

  getDriver: async (id: string): Promise<{ success: boolean; data: Driver }> => {
    const { data } = await api.get(`/drivers/${id}`);
    return data;
  },

  createDriver: async (driver: Partial<Driver>): Promise<{ success: boolean; data: Driver }> => {
    const { data } = await api.post('/drivers', driver);
    return data;
  },

  updateDriver: async (
    id: string,
    driver: Partial<Driver>
  ): Promise<{ success: boolean; data: Driver }> => {
    const { data } = await api.put(`/drivers/${id}`, driver);
    return data;
  },

  deleteDriver: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete(`/drivers/${id}`);
    return data;
  },
};

export default driverService;
