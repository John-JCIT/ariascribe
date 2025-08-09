import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { utImageRouter } from "./routers/utImage";
import { polarRouter } from "./routers/polar";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { mbsAdminRouter } from "./routers/mbs-admin";
import { mbsPublicRouter } from "./routers/mbs-public";

export const appRouter = createTRPCRouter({
  user: userRouter,
  utImage: utImageRouter,
  polar: polarRouter,
  auth: authRouter,
  admin: adminRouter,
  mbsAdmin: mbsAdminRouter,
  mbs: mbsPublicRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
