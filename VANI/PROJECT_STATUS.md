# VANI Project Status

## Current state

- Frontend repo exists in Next.js app router form.
- Database `vani` is live in local MariaDB.
- All 12 tables already existed before this session.
- Additional related sample data has now been inserted successfully.

## Database access used

- Database: `vani`
- User: `root`
- Password auth was used successfully against local MariaDB

## Sample data added in this session

- SQL file: [sql/add_more_sample_data.sql](/home/proster/vani/sql/add_more_sample_data.sql)
- Executed successfully against local MariaDB

## Current row counts

- `users`: 7
- `patients`: 6
- `customers`: 5
- `sessions`: 11
- `transcripts`: 29
- `healthcare_reports`: 7
- `finance_reports`: 4
- `sentiment_analysis`: 9
- `alerts`: 5
- `scheduled_calls`: 4
- `monitoring_programs`: 4
- `analytics_snapshots`: 6

## New linked sample sessions added

- Session `7`: healthcare, Dr. Ananya Iyer, Savita Reddy
- Session `8`: healthcare, Dr. Rajesh Kumar, Arjun Gowda
- Session `9`: finance, Agent Rohan Malhotra, Naveen Kulkarni
- Session `10`: finance, Bank Agent Meera, Farah Khan
- Session `11`: healthcare, Dr. Priya Sharma, Venkatesh Rao

## Important files added or updated recently

- [sql/add_more_sample_data.sql](/home/proster/vani/sql/add_more_sample_data.sql)
- [sql/select_queries.sql](/home/proster/vani/sql/select_queries.sql)
- [prisma/schema.prisma](/home/proster/vani/prisma/schema.prisma)
- [server/src/app.ts](/home/proster/vani/server/src/app.ts)
- [server/src/routes/dashboard.ts](/home/proster/vani/server/src/routes/dashboard.ts)
- [server/src/routes/analytics.ts](/home/proster/vani/server/src/routes/analytics.ts)
- [server/src/routes/sessions.ts](/home/proster/vani/server/src/routes/sessions.ts)
- [server/src/routes/search.ts](/home/proster/vani/server/src/routes/search.ts)
- [server/src/lib/http.ts](/home/proster/vani/server/src/lib/http.ts)

## Recommended next steps

1. Inspect the new sample rows in MariaDB and confirm they match your demo narrative.
2. Verify Prisma against the live MariaDB schema using `prisma db pull` or `prisma generate`.
3. Wire the frontend pages to the API only after finalizing the route contracts.
4. Add Clerk auth after the database/API integration is stable.

## Notes

- Existing user changes in frontend files were not reverted.
- The API scaffold exists, but Prisma client generation was not fully verified in-session.
