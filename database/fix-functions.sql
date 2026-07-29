-- Run this in Supabase SQL Editor
-- Fixes the increment_campaign_count function with correct parameter names

CREATE OR REPLACE FUNCTION increment_campaign_count(p_campaign_id UUID, p_field TEXT)
RETURNS VOID AS $$
BEGIN
  IF p_field = 'delivered_count' THEN
    UPDATE campaigns SET delivered_count = delivered_count + 1 WHERE id = p_campaign_id;
  ELSIF p_field = 'read_count' THEN
    UPDATE campaigns SET read_count = read_count + 1 WHERE id = p_campaign_id;
  ELSIF p_field = 'failed_count' THEN
    UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = p_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix increment_message_count
CREATE OR REPLACE FUNCTION increment_message_count(contact_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE contacts
  SET message_count = message_count + 1,
      last_message_at = NOW()
  WHERE id = contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
