import { Hono } from "hono";
import { decode, sign, verify, jwt } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { cors } from "hono/cors";
import dayjs from "dayjs";
import PocketBase from "pocketbase";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

const ACCESS_TOKEN_SECRET: string = process.env.ACCESS_TOKEN_SECRET || "";
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET || "";

const pb = new PocketBase("http://127.0.0.1:8090");

app.use("*", cors());

app.use(
  "/auth/*",
  jwt({
    secret: ACCESS_TOKEN_SECRET,
  })
);

app.get("/", async (c) => {
  return c.text("Hello World!");
});

app.post("/auth/register", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const data = {
      password: password,
      passwordConfirm: password,
      email: email,
      emailVisibility: true,
    };

    const record = await pb.collection("users").create(data);
    return c.json({ message: "User registered successfully", data: record });
  } catch (ex) {
    console.log(ex);
    return c.json({ message: "User registration failed" }, 400);
  }
});

app.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) {
    return c.json({ message: "Email and password are required" }, 400);
  }
  try {
    const _ = await pb.collection("users").authWithPassword(email, password);
    return c.json({
      message: "User logged in successfully",
      data: pb.authStore,
    });
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

app.post("/login/withToken", async (c) => {
  const { email, password } = await c.req.json();

  try {
    const user = await pb
      .collection("users")
      .getFullList({ filter: `email="${email}"` });
    if (!user) {
      return c.json({ message: "User not found" }, 400);
    }
    return pb
      .collection("users")
      .authWithPassword(email, password)
      .then(async (response) => {
        const accessToken = await sign(
          {
            email: response.record.email,
            exp: dayjs().add(30, "minutes").unix(),
          },
          ACCESS_TOKEN_SECRET
        );
        const refreshToken = await sign(
          { email: response.record.email, exp: dayjs().add(7, "days").unix() },
          REFRESH_TOKEN_SECRET
        );
        return c.json({ accessToken, refreshToken });
      })
      .catch((err) => {
        return c.json({ message: err }, 400);
      });
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

app.post("/refresh-token", async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken)
    return c.json({ message: "Refresh token is required" }, 400);

  try {
    const decoded = await verify(refreshToken, REFRESH_TOKEN_SECRET);
    const accessToken = await sign(
      { email: decoded.email, exp: dayjs().add(30, "minutes").unix() },
      ACCESS_TOKEN_SECRET
    );

    return c.json({ accessToken });
  } catch (ex) {
    return c.json({ message: "Invalid refresh token." }, 400);
  }
});

app.get("/auth/user", (c) => {
  const payload = c.get("jwtPayload");
  return c.json(payload);
});

export default {
  port: 3005,
  fetch: app.fetch,
};
