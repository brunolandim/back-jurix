import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    const messageKey = `errors.${resource.charAt(0).toLowerCase() + resource.slice(1)}NotFound`;
    super(message, 404, 'NOT_FOUND', { resource, id }, messageKey);
    this.name = 'NotFoundError';
  }
}
