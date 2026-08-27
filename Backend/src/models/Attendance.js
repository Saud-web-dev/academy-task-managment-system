// import mongoose from 'mongoose';

// const attendanceSchema = new mongoose.Schema({
//   employeeId: {
//     type: String,
//     required: true,
//     index: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   date: {
//     type: Date,
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ['Present', 'Leave', 'Half Day','Absent'],
//     required: true
//   },
//   reason: {
//     type: String,
//     default: ''
//   },
//   status: {
//     type: String,
//     enum: ['Pending', 'Approved', 'Rejected'],
//     default: 'Pending'
//   },
//   // Location fields
//   latitude: {
//     type: Number,
//     default: null
//   },
//   longitude: {
//     type: Number,
//     default: null
//   },
//   locationAddress: {
//     type: String,
//     default: ''
//   },
//   locationDetails: {
//     building: String,
//     street: String,
//     suburb: String,
//     city: String,
//     district: String,
//     state: String,
//     country: String,
//     postalCode: String,
//     formatted: String,
//     accuracy: {
//       type: String,
//       enum: ['exact', 'approximate', 'general'],
//       default: 'general'
//     }
//   },
//   locationCapturedAt: {
//     type: Date,
//     default: null
//   },
//   locationUpdatedAt: {
//     type: Date,
//     default: null
//   },
//   // Real-time location tracking
//   realTimeLocation: {
//     enabled: {
//       type: Boolean,
//       default: false
//     },
//     history: [{
//       latitude: Number,
//       longitude: Number,
//       locationAddress: String,
//       timestamp: {
//         type: Date,
//         default: Date.now
//       },
//       deviceInfo: {
//         platform: String,
//         browser: String,
//         ip: String
//       }
//     }]
//   },
//   adminRemarks: {
//     type: String,
//     default: ''
//   },
//   processedAt: {
//     type: Date,
//     default: null
//   },
//   processedBy: {
//     type: String,
//     default: null
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });

// // Indexes for better performance
// attendanceSchema.index({ employeeId: 1, date: -1 });
// attendanceSchema.index({ status: 1, createdAt: -1 });
// attendanceSchema.index({ 'realTimeLocation.history.timestamp': -1 });
// attendanceSchema.index({ latitude: 1, longitude: 1 }); // For geospatial queries

// // ================= INSTANCE METHODS =================

// /**
//  * Update location for this attendance record
//  */
// attendanceSchema.methods.updateLocation = async function(latitude, longitude, address, deviceInfo = {}) {
//   this.latitude = latitude;
//   this.longitude = longitude;
//   this.locationAddress = address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
//   this.locationUpdatedAt = new Date();
  
//   // Add to history if real-time tracking is enabled
//   if (this.realTimeLocation.enabled) {
//     this.realTimeLocation.history.push({
//       latitude,
//       longitude,
//       locationAddress: this.locationAddress,
//       timestamp: new Date(),
//       deviceInfo
//     });
    
//     // Keep only last 100 entries to prevent document growth
//     if (this.realTimeLocation.history.length > 100) {
//       this.realTimeLocation.history = this.realTimeLocation.history.slice(-100);
//     }
//   }
  
//   return await this.save();
// };

// /**
//  * Enable real-time tracking
//  */
// attendanceSchema.methods.enableRealTimeTracking = function() {
//   this.realTimeLocation.enabled = true;
//   return this.save();
// };

// /**
//  * Disable real-time tracking
//  */
// attendanceSchema.methods.disableRealTimeTracking = function() {
//   this.realTimeLocation.enabled = false;
//   return this.save();
// };

// /**
//  * Get location history
//  */
// attendanceSchema.methods.getLocationHistory = function(limit = 20) {
//   return this.realTimeLocation.history.slice(-limit).reverse();
// };

// /**
//  * Get latest location
//  */
// attendanceSchema.methods.getLatestLocation = function() {
//   if (this.realTimeLocation.history.length === 0) {
//     return null;
//   }
//   return this.realTimeLocation.history[this.realTimeLocation.history.length - 1];
// };

// // ================= STATIC METHODS =================

// /**
//  * Find nearby locations within radius
//  */
// attendanceSchema.statics.findNearby = function(latitude, longitude, radiusInKm = 1, status = null) {
//   // Earth's radius in km
//   const earthRadius = 6371;
  
//   // Convert radius to radians
//   const radiusInRadians = radiusInKm / earthRadius;
  
//   // Convert coordinates to radians
//   const latRad = latitude * Math.PI / 180;
//   const lonRad = longitude * Math.PI / 180;
  
//   const query = {
//     latitude: { $ne: null },
//     longitude: { $ne: null }
//   };
  
//   if (status) {
//     query.status = status;
//   }
  
//   return this.find({
//     ...query,
//     $expr: {
//       $lt: [
//         {
//           $acos: {
//             $add: [
//               { $multiply: [Math.sin(latRad), { $sin: { $multiply: ['$latitude', Math.PI / 180] } }] },
//               { $multiply: [
//                 { $multiply: [Math.cos(latRad), { $cos: { $multiply: ['$latitude', Math.PI / 180] } }] },
//                 { $multiply: [Math.cos(lonRad), { $cos: { $multiply: ['$longitude', Math.PI / 180] } }] }
//               ] }
//             ]
//           }
//         },
//         radiusInRadians
//       ]
//     }
//   });
// };

// /**
//  * Find records with missing or invalid location addresses
//  */
// attendanceSchema.statics.findWithInvalidLocation = function() {
//   return this.find({
//     $or: [
//       { locationAddress: "Office Location" },
//       { locationAddress: "" },
//       { locationAddress: null },
//       { locationAddress: { $exists: false } }
//     ],
//     latitude: { $ne: null, $ne: undefined },
//     longitude: { $ne: null, $ne: undefined }
//   });
// };

// /**
//  * Bulk update location addresses
//  */
// attendanceSchema.statics.bulkUpdateLocations = async function(locationDataArray) {
//   const updates = locationDataArray.map(({ id, address, details }) => ({
//     updateOne: {
//       filter: { _id: id },
//       update: {
//         $set: {
//           locationAddress: address,
//           locationDetails: details,
//           locationUpdatedAt: new Date()
//         }
//       }
//     }
//   }));
  
//   return this.bulkWrite(updates);
// };

// const Attendance = mongoose.model('Attendance', attendanceSchema);
// export default Attendance;




// Backend/src/models/Attendance.js
import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["Present", "Leave", "Half Day"],
      default: "Present",
    },
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Absent"],
      default: "Pending",
    },
    adminRemarks: {
      type: String,
      default: "",
    },
    markedBy: {
      type: String,
      default: "employee",
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // ✅ Edit history tracking
    editHistory: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ type: 1 });
AttendanceSchema.index({ employeeId: 1 });

const Attendance = mongoose.model("Attendance", AttendanceSchema);

export default Attendance;
