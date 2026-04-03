-- Optional multimodal attachments (image data URLs) for Gaspol Tutor messages

ALTER TABLE gaspol_tutor_chats
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

COMMENT ON COLUMN gaspol_tutor_chats.attachments IS
  'OpenAI-style parts: [{ "type": "image_url", "url": "<data URL or https>" }] for user rows';
