UPDATE "listings"
SET
  "publication_status" = 'published',
  "status" = 'published',
  "updated_at" = NOW()
WHERE
  "source" = 'self_service'
  AND "publication_status" = 'draft'
  AND "deleted_at" IS NULL;
