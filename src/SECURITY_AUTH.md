Backend requirements and recommendations for auth (frontend assumes these):

1. Access / Refresh token policy

- Access token: short-lived (recommended 5-15 minutes). Use JWT claims (exp) to enforce.
- Refresh token: long-lived (recommended 7-30 days) but rotated on each use and stored hashed in DB.

2. Refresh cookie

- Refresh token should be returned as an HttpOnly cookie by the backend.
- Set cookie flags: HttpOnly; Secure; SameSite=Lax (or Strict if possible); Path=/refresh or appropriate path.

3. Refresh rotation and revocation

- On each /refresh, issue a new refresh token and invalidate the previous one (store only hash server-side).
- Add a logout endpoint that revokes the refresh token and clears the cookie.

4. /me endpoint

- Provide an authenticated `/me` endpoint that returns the current user or 401 if session invalid.
- Frontend calls `/me` after refresh to confirm session and load user data.

5. Security considerations

- Protect backend endpoints against brute force and implement rate-limiting for `/login` and `/refresh`.
- If refresh token theft is a concern, use additional device/session identifiers and allow users to list/revoke sessions.

Frontend notes:

- This frontend stores access token in memory by default and only persists it to `localStorage` when user explicitly sets "remember me".
- Frontend uses axios `withCredentials: true` to let browser attach httpOnly refresh cookie on /refresh.
