-- AI Settings Table
-- Stores AI provider configuration for admin control

CREATE TABLE ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'gemini')),
  api_key TEXT, -- Encrypted or null if using env var

  -- Model configuration
  model TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT false,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one active provider at a time
  UNIQUE(provider)
);

-- Ensure only one provider is active
CREATE UNIQUE INDEX idx_ai_settings_active ON ai_settings(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view ai_settings" ON ai_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert ai_settings" ON ai_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update settings
CREATE POLICY "Admins can update ai_settings" ON ai_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete settings
CREATE POLICY "Admins can delete ai_settings" ON ai_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default Anthropic setting (uses env var for API key)
INSERT INTO ai_settings (provider, model, is_active, api_key)
VALUES ('anthropic', 'claude-sonnet-4-6', true, NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_settings_updated_at();
