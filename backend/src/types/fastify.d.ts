import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      phone: string;
      email: string | null;
      name: string | null;
      role: string;
      college: string | null;
    };
  }
}
