# Working in this repo

After every change, run the regression tier that matches it before committing or pushing; see [docs/regression.md](docs/regression.md).

- Any change to logic, data, routes, storage, sign-in, the API, AI or food rules: `npm run regression`.
- A small UI change (styles or wording on one screen): `npm run regression:ui -- e2e/<spec for that screen>.ts`.
- After every deploy: `npm run regression:live`.

Don't report a change as done while any step fails. If a test fails because of an intended change, update the test and explain why in the commit.
