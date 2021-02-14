class ConnectionService {
  static connection: any;
  static setConnection(mongoose: any) {
    this.connection = mongoose.connection;
  }
  static getConnection() {
    return this.connection;
  }
}
export default ConnectionService;
