import { AppError } from './app-error';

export class PlanLimitError extends AppError {
  constructor(resource: string, limit: number) {
    super(
      `Plan limit reached: maximum ${limit} ${resource} allowed`,
      403,
      'PLAN_LIMIT_REACHED',
      { resource, limit }
    );
  }
}
