// Augments Express Request with the authenticated user payload
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      username: string;
      role: string;
      name: string;
    };
  }
}
