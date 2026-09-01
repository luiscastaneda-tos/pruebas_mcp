export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "INTERNAL_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string | number) {
    super(`${entity} no encontrado${id === undefined ? "" : ` con ID ${String(id)}`}`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Credenciales inválidas.") {
    super(message, 401, "UNAUTHORIZED");
  }
}
