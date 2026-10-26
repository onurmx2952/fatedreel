# Google account and learning progress

Both /o11/ and /o12/ load /learning/account.js. It reuses the existing Google client and secure HttpOnly program_session cookie. GET /api/learning/:app renews the session for 30 days. Progress lives in PROGRAM_DB.learning_data, separately keyed by user and application; the table is created automatically. No new OAuth secrets or infrastructure are required.

The client uploads only the book state or Atlas settings and versioned progress. Existing local progress is offered for import when an account has no copy. Different device/account copies require an explicit choice; restoring cloud data preserves the displaced device copy under learning-backup:* and replacing cloud data downloads its previous copy. Exported backups contain {app,data}, with localStorage JSON strings under data; they are separate from each application's own backup format. Revision checks reject concurrent writes, and the interface asks the user to reconcile instead of overwriting. Offline writes stay local and retry when online. Logout is shared with /program/.

Account state and progress API responses must never enter a service worker cache. The Atlas worker bypasses /api/ requests; the book worker only handles /o11/ assets. Google account consent still requires the user. The session is renewed on app visits; browsers can clear cookies/storage and Google can require a new sign-in.

Validation: JavaScript syntax checks; SQLite-backed API tests for unauthenticated requests, account isolation, separate app keys and concurrent revision conflicts; Edge browser checks at mobile width for both apps, writes, reload persistence and a fresh browser context restoring saved book progress.
