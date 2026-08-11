import { utilities as nestWinstonModuleUtilities, WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

export const loggerConfig: WinstonModuleOptions = {
  level: isDev ? 'debug' : 'info',
  transports: [
    new winston.transports.Console({
      format: isDev
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('ParkingApp', {
              colors: true,
              prettyPrint: true,
            }),
          )
        : winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
    }),
  ],
};
