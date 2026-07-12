import api from './api';
import type {
  Trip,
  TripFilters,
  TripFormData,
  TripActionResponse
} from '../types/trip';

const tripService = {
  getTrips: async (filters: TripFilters = {}): Promise<{ success: boolean; data: Trip[]; count: number }> => {
    // Build query parameters from filters
    const params = new URLSearchParams();

    if (filters.source) params.append('source', filters.source);
    if (filters.destination) params.append('destination', filters.destination);
    if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters.status) params.append('status', filters.status);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const { data } = await api.get(`/trips?${params.toString()}`);
    return data;
  },

  getTripById: async (id: string): Promise<{ success: boolean; data: Trip }> => {
    const { data } = await api.get(`/trips/${id}`);
    return data;
  },

  createTrip: async (tripData: TripFormData): Promise<{ success: boolean; data: Trip }> => {
    const { data } = await api.post('/trips', tripData);
    return data;
  },

  updateTrip: async (id: string, tripData: Partial<TripFormData>): Promise<{ success: boolean; data: Trip }> => {
    const { data } = await api.put(`/trips/${id}`, tripData);
    return data;
  },

  deleteTrip: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete(`/trips/${id}`);
    return data;
  },

  dispatchTrip: async (id: string): Promise<{ success: boolean; data: Trip }> => {
    const { data } = await api.post(`/trips/${id}/dispatch`);
    return data;
  },

  completeTrip: async (id: string, actualDistance: number, fuelConsumed: number): Promise<{ success: boolean; data: Trip }> => {
    const { data } = await api.post(`/trips/${id}/complete`, { actualDistance, fuelConsumed });
    return data;
  },

  cancelTrip: async (id: string): Promise<{ success: boolean; data: Trip }> => {
    const { data } = await api.post(`/trips/${id}/cancel`);
    return data;
  }
};

export default tripService;