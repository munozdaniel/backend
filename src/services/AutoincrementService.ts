import mongoose from 'mongoose';
const AutoIncrement = require('mongoose-sequence')(mongoose);

class AutoincrementService {
  static setConnection(mongoose: any) {
    AutoIncrement.initialize(mongoose.connection);
  }
  static getAutoIncrement() {
    return AutoIncrement;
  }
}
export default AutoincrementService;
