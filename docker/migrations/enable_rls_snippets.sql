-- Enable RLS for snippets and snippet_versions for existing databases

ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets FORCE ROW LEVEL SECURITY;
ALTER TABLE snippet_versions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS snippets_select_policy ON snippets;
CREATE POLICY snippets_select_policy ON snippets
FOR SELECT
USING (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippets_insert_policy ON snippets;
CREATE POLICY snippets_insert_policy ON snippets
FOR INSERT
WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippets_update_policy ON snippets;
CREATE POLICY snippets_update_policy ON snippets
FOR UPDATE
USING (user_id = current_setting('app.current_user_id', true)::uuid)
WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippets_delete_policy ON snippets;
CREATE POLICY snippets_delete_policy ON snippets
FOR DELETE
USING (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippet_versions_select_policy ON snippet_versions;
CREATE POLICY snippet_versions_select_policy ON snippet_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);

DROP POLICY IF EXISTS snippet_versions_insert_policy ON snippet_versions;
CREATE POLICY snippet_versions_insert_policy ON snippet_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);

DROP POLICY IF EXISTS snippet_versions_update_policy ON snippet_versions;
CREATE POLICY snippet_versions_update_policy ON snippet_versions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);

DROP POLICY IF EXISTS snippet_versions_delete_policy ON snippet_versions;
CREATE POLICY snippet_versions_delete_policy ON snippet_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);
