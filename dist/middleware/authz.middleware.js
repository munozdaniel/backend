import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }),
    // Validate the audience and the issuer.
    audience: process.env.AUTH0_API_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    // algorithm: 'RS256'
    algorithms: ['RS256'],
});
export default checkJwt;
//# sourceMappingURL=authz.middleware.js.map