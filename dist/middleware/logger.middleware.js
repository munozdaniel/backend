function loggerMiddleware(request, response, next) {
    console.log(`${request.method} ${request.path}`);
    next();
}
export default loggerMiddleware;
//# sourceMappingURL=logger.middleware.js.map