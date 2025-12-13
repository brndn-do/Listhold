export type ServiceErrorMessage = 'internal' | 'already-exists' | 'unauthorized' | 'misc';

export class ServiceError extends Error {
  constructor(message: ServiceErrorMessage) {
    super(message);
    this.name = 'ServiceError';
    Object.setPrototypeOf(this, ServiceError.prototype); 
  }
}
