import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { authService } from '../../modules/auth/auth.service.js';

export function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  
  authService.verifyAccessToken(token)
    .then((user) => {
      request.user = {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
      };
      done();
    })
    .catch(() => {
      reply.code(401).send({ error: 'Invalid or expired token' });
    });
}

export function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    authService.verifyAccessToken(token)
      .then((user) => {
        request.user = {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          role: user.role,
          college: user.college,
        };
        done();
      })
      .catch(() => {
        done();
      });
  } else {
    done();
  }
}


export function requireRole(...roles: string[]) {
  return function (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) {
    if (!request.user) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ error: 'Forbidden - Insufficient permissions' });
      return;
    }

    done();
  };
}
