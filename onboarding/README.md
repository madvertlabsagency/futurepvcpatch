# Client onboarding guide and walkthrough video

Makes the branded Madvert Labs guide (PDF) and walkthrough video (MP4) for a client, from the live funnel and CRM.

1. Edit `config.json`: client name, funnel and CRM links, client email, WhatsApp, sample lead answers.
2. `CRM_EMAIL=... CRM_PASSWORD=... node onboarding/capture.cjs`
   Submits ONE sample lead on the live funnel, screenshots every step, logs into the CRM with the client's
   login and screenshots each CRM page, and records captioned clips. Delete the sample lead in the CRM after.
3. Copy that lead's row to `out/lead-row.json` (Supabase), then `npx tsx onboarding/render.ts` renders the
   real customer, client and reminder emails and the quote PDF.
4. `node onboarding/email-shots.cjs` screenshots the emails, `pdftoppm -png -r 110 -f 1 -l 2 onboarding/out/quote.pdf onboarding/out/shots/pdf`
   turns the PDF into images.
5. `node onboarding/guide.cjs` builds `out/<Client>-Lead-System-Guide.pdf`; pages without screenshots are skipped.
6. `node onboarding/video.cjs` builds `out/<Client>-Walkthrough.mp4` (vertical, 1080x1920).

Nothing secret is stored here: the CRM login comes from the environment when you run step 2.
