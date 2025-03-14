import { Hono } from 'hono';
import { decode, sign, verify, jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

type Variables = JwtVariables

const app = new Hono<{Variables:Variables}>();

const users: any[] = [];

const ACCESS_TOKEN_SECRET: string = process.env.ACCESS_TOKEN_SECRET || ''
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET || ''


app.use('*', cors());

app.use(
  '/auth/*',
  jwt({
    secret: ACCESS_TOKEN_SECRET,
  })
)

app.get('/', async (c) => {
  return c.text('Hello World!');
});

app.post('/register', async (c) => {
  try {
    const { username, password } = await c.req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    return c.json({ message: 'User registered successfully' });
  } catch (ex) {
    return c.json({ message: 'User registration failed' }, 400);
  }
  
});

// User Login
app.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
      return c.json({ message: 'Invalid credentials' }, 401);
  }
  
  const accessToken = await sign({ username: user.username , exp: dayjs().add(30, 'second').unix()}, ACCESS_TOKEN_SECRET );
  const refreshToken = await sign({ username: user.username, exp: dayjs().add(7, 'days').unix() }, REFRESH_TOKEN_SECRET);
  return c.json({ accessToken, refreshToken });

  
});

app.post('/refresh-token', async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ message: 'Refresh token is required' }, 400);

  try {

      const decoded = await verify(refreshToken, REFRESH_TOKEN_SECRET);
      const accessToken = await sign({ username: decoded.username , exp: dayjs().add(30, 'second').unix() }, ACCESS_TOKEN_SECRET);
      
      return c.json({ accessToken });
  } catch (ex) {
      return c.json({ message: 'Invalid refresh token.' }, 400);
  }
});

app.get('/auth/user', (c) => {
  const payload = c.get('jwtPayload')
  return c.json(payload)
});

export default { 
  port: 3005, 
  fetch: app.fetch, 
} 