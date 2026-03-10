import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const correlationInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const correlationId = crypto.randomUUID();
  const correlatedReq = req.clone({
    setHeaders: { 'X-Correlation-ID': correlationId },
  });
  return next(correlatedReq);
};
