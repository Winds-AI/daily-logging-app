-- Create the schema
CREATE SCHEMA daily_log;

-- Create the messages table
CREATE TABLE daily_log.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender TEXT NOT NULL,
  suggestion JSONB,
  "suggestionLoading" BOOLEAN,
  audio BYTEA
);

-- Create the tasks table
CREATE TABLE daily_log.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  "user" TEXT NOT NULL
);

-- Create the themes table
CREATE TABLE daily_log.themes (
  "user" TEXT PRIMARY KEY,
  theme JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE daily_log.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log.themes ENABLE ROW LEVEL SECURITY;


-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to own messages" ON daily_log.messages;
DROP POLICY IF EXISTS "Allow all access to own tasks" ON daily_log.tasks;
DROP POLICY IF EXISTS "Allow all access to own themes" ON daily_log.themes;

-- Create permissive policies
CREATE POLICY "Allow all" ON daily_log.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON daily_log.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON daily_log.themes FOR ALL USING (true) WITH CHECK (true);

-- Grant usage on the schema to the anon role
GRANT USAGE ON SCHEMA daily_log TO anon;

-- Grant permissions on the tables to the anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_log.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_log.tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_log.themes TO anon;