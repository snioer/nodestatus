import { Context, Middleware } from 'koa';
import {
  bulkCreateServer,
  createServer,
  deleteServer,
  readServersList,
  updateServer,
  updateOrder
} from '../model/server';
import { createRes } from '../lib/utils';
import { readEvents } from '../model/event';

async function handleRequest<T>(ctx: Context, handler: Promise<T>): Promise<void> {
  try {
    ctx.body = createRes({ data: await handler });
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = createRes(1, err.message);
  }
}

const getListServers: Middleware = async ctx => {
  await handleRequest(ctx, readServersList().then(data => data.sort((x, y) => y.order - x.order)));
};

const setServer: Middleware = async ctx => {
  const { username } = ctx.request.body;
  const { data } = ctx.request.body;
  if (!username || !data) {
    ctx.status = 400;
    ctx.body = createRes(1, 'Wrong request');
    return;
  }
  if (username === data.username) delete data.username;
  await handleRequest(ctx, updateServer(username, data));
};

const addServer: Middleware = async ctx => {
  const data = ctx.request.body;
  if (!data) {
    ctx.status = 400;
    ctx.body = createRes(1, 'Wrong request');
    return;
  }
  if (Object.hasOwnProperty.call(data, 'data')) {
    try {
      const d = JSON.parse(data.data);
      await handleRequest(ctx, bulkCreateServer(d));
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = createRes(1, 'Wrong request');
    }
  } else {
    await handleRequest(ctx, createServer(data));
  }
};

const removeServer: Middleware = async ctx => {
  const { username = '' } = ctx.params;
  if (!username) {
    ctx.status = 400;
    ctx.body = createRes(1, 'Wrong request');
    return;
  }
  await handleRequest(ctx, deleteServer(username));
};

const modifyOrder: Middleware = async ctx => {
  const { order = [] } = ctx.request.body as { order: number[] };
  if (!order.length) {
    ctx.status = 400;
    ctx.body = createRes(1, 'Wrong request');
    return;
  }
  await handleRequest(ctx, updateOrder(order.join(',')));
};

const queryEvents: Middleware = async ctx => {
  await handleRequest(ctx, readEvents());
};

export {
  getListServers,
  setServer,
  addServer,
  removeServer,
  modifyOrder,
  queryEvents
};
