# Apna Bazaar: Render deployment

This project is packaged as one Docker web service: Django serves the React app and its API from the same address. PostgreSQL, uploaded pictures, and reset-password email use separate services so they do not depend on Render's temporary local disk.

## Free service accounts to prepare

1. Create a GitHub repository and upload this project. Do not upload `.env`, database files, or real credentials.
2. Create a free PostgreSQL database on Neon. Copy its pooled connection string into Render's `DATABASE_URL` value. Keep the password private.
3. Create a Cloudinary account. Copy its `CLOUDINARY_URL` from the dashboard. This stores uploaded product and shop photos.
4. Create a Resend account and API key with sending-only access. Verify a sender domain and use an address on that domain for `DEFAULT_FROM_EMAIL`. Without a verified sender domain, password reset emails to other users may not send.
5. In Render, choose **New → Blueprint**, connect the repository, and let Render read `render.yaml`. When prompted, enter the values above and set a new admin username, email, and strong password.

The Blueprint creates a free Render web service and generates `DJANGO_SECRET_KEY` for you. Render's free web service can sleep after inactivity, so its first request after sleep may take about a minute. The free Render web service's local disk is temporary; do not use SQLite or local uploads for deployed data. Use Neon and Cloudinary as described.

## Admin setup

On the first start, the startup script runs database migrations and creates the Django admin user from `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, and `DJANGO_SUPERUSER_PASSWORD` if that username does not exist yet. After the first successful deployment, remove the `DJANGO_SUPERUSER_PASSWORD` environment variable from Render. The admin account remains in PostgreSQL.

The Django admin is at `/admin/`. The React admin dashboard uses the same account role checks already in the application.

## Local development

- Backend: install `backend/requirements.txt`, then run Django from `backend/server`.
- Frontend: run `npm ci` and `npm run dev` from `frontend`.
- For local development, leave `DATABASE_URL`, `CLOUDINARY_URL`, and `RESEND_API_KEY` empty to use SQLite, local media, and console email. Set `DJANGO_DEBUG=true`.

## Important

- Free plans and limits can change; no hosting company guarantees that a free tier will remain free forever.
- Render Free services sleep when idle and have temporary disk. Free Render PostgreSQL expires after 30 days, so this setup intentionally uses Neon PostgreSQL.
- Resend's free allowance is currently 3,000 emails monthly, limited to 100 each day. Check its current terms before relying on email delivery.
- Do not reuse any credential that was previously pasted into chat or committed. Rotate exposed Django and email credentials before deployment. Keep all secrets in Render's environment settings, not in the ZIP or source control.
