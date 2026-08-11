import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const error = this.resolveError(exception, status);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveError(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      // Services throw new NotFoundException('ERROR_CODE') — body is the string
      if (typeof body === 'string') return body;
      // ValidationPipe throws { message: string[], error: string }
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const msg = (body as Record<string, unknown>).message;
        return Array.isArray(msg) ? (msg as string[]).join('; ') : String(msg);
      }
    }

    if (status >= 500) {
      return process.env.NODE_ENV === 'production'
        ? 'INTERNAL_SERVER_ERROR'
        : String(exception instanceof Error ? exception.message : exception);
    }

    return 'UNKNOWN_ERROR';
  }
}
