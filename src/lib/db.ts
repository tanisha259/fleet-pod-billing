import fs from 'fs';
import path from 'path';
import { Trip } from '../types/trip';
import { initialTrips } from '../data/trips';

const DB_PATH = path.join(process.cwd(), 'data-store.json');

export function getTrips(): Trip[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialTrips, null, 2), 'utf-8');
      return initialTrips;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data store:', err);
    return initialTrips;
  }
}

export function saveTrips(trips: Trip[]): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(trips, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data store:', err);
  }
}

export function getTripById(id: string): Trip | undefined {
  const trips = getTrips();
  return trips.find(t => t.id === id || t.smsUploadToken === id);
}

export function updateTrip(id: string, updates: Partial<Trip>): Trip | null {
  const trips = getTrips();
  const index = trips.findIndex(t => t.id === id || t.smsUploadToken === id);
  if (index === -1) return null;

  trips[index] = { ...trips[index], ...updates };
  saveTrips(trips);
  return trips[index];
}
