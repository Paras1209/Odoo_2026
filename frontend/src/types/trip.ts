export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  status: 'draft' | 'dispatched' | 'completed' | 'cancelled';
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    registrationNumber: string;
    name: string;
    type: string;
    maxCapacity: number;
  };
  driver?: {
    name: string;
    licenseNumber: string;
    safetyScore: number;
  };
}

export interface TripFilters {
  source?: string;
  destination?: string;
  vehicleType?: string;
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface TripFormData {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
}

export interface TripActionResponse {
  success: boolean;
  data?: Trip;
  message?: string;
}

export interface TripStats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  draftTrips: number;
}