export function errorMiddleware(error, request, response, next) {
    const status = error.status || 500;
    const message = error.message || 'Ocurrió un problema interno';
    response.status(status).send({
        message,
        status,
    });
}
//# sourceMappingURL=error.middleware.js.map