## Introduction

This project is built using [Bun](https://bun.sh/) as the JavaScript runtime and [Hono.js](https://hono.dev/) as the web framework. Hono.js is a fast and lightweight framework for building web applications and APIs.

This project can be used to test JWT authentication with PocketBase.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have [Bun](https://bun.sh/) installed on your machine.
- You have a code editor installed (e.g., VSCode, Atom).

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/phongpisut/bff-genovation.git
   cd bff-genovation
   ```

2. Install the dependencies using Bun
   ```bash
   bun install
   ```
3. Create .env file
   ```bash
   ACCESS_TOKEN_SECRET=<your secret>
   REFRESH_TOKEN_SECRET=<your secret>
   ```
4. Install PocketBase
   ```bash
   bun pb:mac
   or
   bun pb:win
   or
   download the PocketBase zip file from the official website
   and extract the contents of the zip file into the `/pb` directory
   ```

## Usage

```base
// Serve DataBase
bun pb:serve
----
// Serve Service (localhost:3005)
bun dev
```

### User Authentication

1.  **Add a User**: Create a new user in the PocketBase dashboard.
2.  **Login**: Use the following endpoint to log in:
    - **POST**: `/login`
    - \***\*Body\*\***:
      - `email`: The user's email address.
      - `password`: The user's password.
3.  **Use Tokens**: - **POST**: `/login/withToken` - **Body**: Use the same body as the `/login` endpoint, which includes: - `email`: The user's email address. - `password`: The user's password.
    Upon successful login, you will receive both an `access_token` and a `refresh_token` for further testing. following endpoints: - **Protected Route : GET**: `/auth/user` (use the `access_token` as a Bearer token) - **POST**: `/refresh-token`
