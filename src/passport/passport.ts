import { Strategy, ExtractJwt } from 'passport-jwt';
import User from '../user/user.interface';
import userModel from '../user/user.model';
import { underscoreId, config } from './config';

export const applyPassportStrategy = (passport: {
  use: (arg0: Strategy) => void;
}) => {
  const options: any = {};
  options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  options.secretOrKey = config.passport.secret;
  passport.use(
    new Strategy(options, (payload, done) => {
      userModel.findOne({ email: payload.email }, (err: any, user: User) => {
        if (err) return done(err, false);
        if (user) {
          return done(null, {
            email: user.email,
            _id: user[underscoreId],
          });
        }
        return done(null, false);
      });
    })
  );
};
