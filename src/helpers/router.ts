import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface RouteParams<TContext = Record<string, string>> {
  event: APIGatewayProxyEvent;
  context: TContext;
  params: Record<string, string>;
}

export type RouteHandler<TContext = Record<string, string>> = (params: RouteParams<TContext>) => Promise<APIGatewayProxyResult>;

export type Route<TContext = Record<string, string>> = { method: string; pattern: string; handler: RouteHandler<TContext> };

export function matchRoute<TContext>(routes: Route<TContext>[], method: string, path: string): { handler: RouteHandler<TContext>; params: Record<string, string> } | null {
  const parts = path.split('/').filter(Boolean);

  for (const route of routes) {
    if (route.method !== method) continue;
    const routeParts = route.pattern.split('/').filter(Boolean);
    if (routeParts.length !== parts.length) continue;

    const params: Record<string, string> = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = parts[i];
      } else if (routeParts[i] !== parts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { handler: route.handler, params };
  }

  return null;
}
