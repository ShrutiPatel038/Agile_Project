import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  modelName:  { type: String, required: true },
  imageUrl:   { type: String, required: true },
  station:    { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  status:     { type: String, enum: ['available', 'reserved', 'in-use', 'maintenance'], default: 'available' },
  pricePerHour: { type: Number, required: true },
  availableAfter: { type: Date },

  allowOneWayTrip:   { type: Boolean, default: false },
  oneWayDropOffFee:  { type: Number, default: 0 },
  currentLocation:   { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },

  licensePlate: { type: String, unique: true, sparse: true },
  vin:          { type: String, unique: true, sparse: true },

  batteryLevel:    { type: Number, min: 0, max: 100 },
  mileage:         { type: Number, default: 0 },
  lastServiceDate: { type: Date },
  nextServiceDue:  { type: Date },
  insuranceExpiry: { type: Date },
});

vehicleSchema.index({ station: 1, status: 1 });
vehicleSchema.index({ status: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
