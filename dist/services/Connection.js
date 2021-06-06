class ConnectionService {
    static setConnection(mongoose) {
        this.connection = mongoose.connection;
    }
    static getConnection() {
        return this.connection;
    }
}
export default ConnectionService;
//# sourceMappingURL=Connection.js.map